import Anthropic from '@anthropic-ai/sdk';

// Vercel does not deploy underscore-prefixed directories as functions, so
// api/_lib/ is bundled into the handlers that import it.
//
// Clients are built PER REQUEST from whichever key the caller proved they may
// use — the owner's server key, or a key the visitor supplied. Visitor keys are
// never cached in module scope: a warm Vercel instance serves many people, and
// a Map keyed by API key would keep other people's credentials in memory well
// past the request that supplied them.
export function clientFor(apiKey) {
  if (!apiKey) throw new UpstreamError('No API key available for this request.', {
    status: 401,
    code: 'no_credentials',
  });
  return new Anthropic({ apiKey, maxRetries: 1 });
}

// Overridable without a redeploy of the code; falls back to the current
// same-tier model. Sonnet 5 runs adaptive thinking by default, which means a
// response can lead with a thinking block — never read content[0] blindly.
export const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

export const MAX_INPUT_CHARS = 24000;

// Caps the worst case cost of a single call. Adaptive thinking bills from this
// same budget, so leave enough room for a full analysis plus its reasoning —
// 4096 truncated real risk assessments in testing, 8192 did not.
export const MAX_OUTPUT_TOKENS = 8192;

export class UpstreamError extends Error {
  constructor(message, { status = 502, code = 'upstream_error', details } = {}) {
    super(message);
    this.name = 'UpstreamError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** Concatenate every text block in a response, ignoring thinking blocks. */
export function extractText(message) {
  const text = (message?.content || [])
    .filter((b) => b?.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text)
    .join('')
    .trim();
  if (!text) {
    throw new UpstreamError('Model returned no text content', {
      code: 'empty_response',
    });
  }
  return text;
}

/**
 * Parse JSON out of a model response that may be wrapped in prose or fences.
 * Tries the raw string, then a fenced block, then the outermost {...} span.
 */
export function parseJsonLoose(raw) {
  const attempts = [];

  attempts.push(raw.trim());

  const fenced = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/i);
  if (fenced) attempts.push(fenced[1].trim());

  const first = raw.indexOf('{');
  const last = raw.lastIndexOf('}');
  if (first !== -1 && last > first) attempts.push(raw.slice(first, last + 1));

  let lastErr;
  for (const candidate of attempts) {
    if (!candidate) continue;
    try {
      return JSON.parse(candidate);
    } catch (err) {
      lastErr = err;
    }
  }

  throw new UpstreamError('Model response was not valid JSON', {
    code: 'invalid_json',
    details: lastErr?.message,
  });
}

/**
 * Call Claude with a cached system prompt and return parsed JSON.
 * `system` is sent as a cacheable text block: prompts above the model's
 * minimum cacheable prefix are served from cache on repeat requests.
 */
export async function callJson({ apiKey, system, input, maxTokens = MAX_OUTPUT_TOKENS, model = MODEL }) {
  const message = await clientFor(apiKey).messages.create({
    model,
    max_tokens: maxTokens,
    system: [
      { type: 'text', text: system, cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: input }],
  });

  if (message.stop_reason === 'max_tokens') {
    throw new UpstreamError(
      'The analysis was longer than the response limit. Try a shorter excerpt.',
      { code: 'output_truncated' },
    );
  }
  if (message.stop_reason === 'refusal') {
    throw new UpstreamError('The model declined to answer this request.', {
      code: 'refusal',
    });
  }

  return parseJsonLoose(extractText(message));
}

/**
 * Map any thrown error to a safe {status, body} without leaking upstream text.
 *
 * `source` ('owner' | 'byok' | undefined) decides who gets blamed. Telling a
 * visitor whose own key was rejected that "the service is misconfigured" sends
 * them to report a bug that is actually their expired key — so the same
 * upstream status has to read differently depending on whose key was spent.
 */
export function toClientError(error, source) {
  const byok = source === 'byok';

  if (error instanceof UpstreamError) {
    return {
      status: error.status,
      body: { error: error.message, code: error.code },
    };
  }
  if (error instanceof Anthropic.RateLimitError) {
    return {
      status: 429,
      body: {
        error: byok
          ? 'Anthropic rate-limited your API key. Wait a moment and try again.'
          : 'Too many requests right now. Try again shortly.',
        code: 'rate_limited',
      },
    };
  }
  if (error instanceof Anthropic.AuthenticationError) {
    return {
      status: byok ? 401 : 500,
      body: byok
        ? {
            error: 'Anthropic rejected your API key. Check that it is correct and still active.',
            code: 'key_rejected',
          }
        : { error: 'The analysis service is not configured correctly.', code: 'not_configured' },
    };
  }
  if (error instanceof Anthropic.PermissionDeniedError) {
    return {
      status: 403,
      body: {
        error: byok
          ? 'Your API key does not have access to this model, or its credit balance is exhausted.'
          : 'The analysis service was denied access to the model.',
        code: 'permission_denied',
      },
    };
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return {
      status: 503,
      body: { error: 'Could not reach the analysis service. Try again.', code: 'upstream_unreachable' },
    };
  }
  if (error instanceof Anthropic.APIError) {
    const status = error.status && error.status >= 500 ? 502 : 400;
    return {
      status,
      body: {
        error:
          byok && status === 400
            ? 'Anthropic rejected the request made with your key.'
            : 'The analysis service rejected the request.',
        code: 'upstream_error',
      },
    };
  }
  return {
    status: 500,
    body: { error: 'Something went wrong running the analysis.', code: 'internal_error' },
  };
}

/** Shared request validation for the JSON analysis endpoints. */
export function validateInput(input, { max = MAX_INPUT_CHARS } = {}) {
  if (typeof input !== 'string') {
    return 'Field "input" must be a string.';
  }
  const trimmed = input.trim();
  if (!trimmed) return 'Field "input" must not be empty.';
  if (trimmed.length > max) {
    return `Input is ${trimmed.length} characters; the limit is ${max}. Paste the specific provision rather than the whole instrument.`;
  }
  return null;
}
