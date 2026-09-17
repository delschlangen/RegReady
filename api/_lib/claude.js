import Anthropic from '@anthropic-ai/sdk';

// Single shared client. Vercel does not deploy underscore-prefixed directories
// as functions, so api/_lib/ is bundled into the handlers that import it.
export const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Overridable without a redeploy of the code; falls back to the current
// same-tier model. Sonnet 5 runs adaptive thinking by default, which means a
// response can lead with a thinking block — never read content[0] blindly.
export const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

export const MAX_INPUT_CHARS = 24000;

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
export async function callJson({ system, input, maxTokens = 8192, model = MODEL }) {
  const message = await client.messages.create({
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

/** Map any thrown error to a safe {status, body} without leaking upstream text. */
export function toClientError(error) {
  if (error instanceof UpstreamError) {
    return {
      status: error.status,
      body: { error: error.message, code: error.code },
    };
  }
  if (error instanceof Anthropic.RateLimitError) {
    return {
      status: 429,
      body: { error: 'Too many requests right now. Try again shortly.', code: 'rate_limited' },
    };
  }
  if (error instanceof Anthropic.AuthenticationError) {
    return {
      status: 500,
      body: { error: 'The analysis service is not configured correctly.', code: 'not_configured' },
    };
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return {
      status: 503,
      body: { error: 'Could not reach the analysis service. Try again.', code: 'upstream_unreachable' },
    };
  }
  if (error instanceof Anthropic.APIError) {
    return {
      status: error.status && error.status >= 500 ? 502 : 400,
      body: { error: 'The analysis service rejected the request.', code: 'upstream_error' },
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
