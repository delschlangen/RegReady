import { clientFor, MODEL, extractText, parseJsonLoose, toClientError, UpstreamError } from './_lib/claude.js';
import { resolveCredentials, applyPrivacyHeaders, BYOK } from './_lib/auth.js';
import { checkOrigin, checkCallRate } from './_lib/guard.js';

const systemPrompt = `Given a legislative or regulatory item title and abstract, provide a JSON response with three fields: "summary" (2-3 sentence plain language explanation), "relevance" (High, Medium, or Low — how relevant is this to an organization building or deploying AI products), and "productImpact" (one sentence on which product areas are affected). Respond only in valid JSON.`;

const MAX_FIELD = 4000;

function clamp(value, max = MAX_FIELD) {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', code: 'method_not_allowed' });
  }

  let source;
  try {
    checkOrigin(req);

    const { title, abstract, jurisdiction } = req.body || {};

    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        error: 'Missing required field: title',
        code: 'missing_fields',
      });
    }

    const creds = resolveCredentials(req);
    source = creds.source;
    checkCallRate(req, source);

    const message = await clientFor(creds.apiKey).messages.create({
      model: MODEL,
      // Summarisation is a low-effort task, but adaptive thinking draws from the
      // same budget as the answer — leave headroom so the text block survives.
      max_tokens: 2000,
      output_config: { effort: 'low' },
      system: [
        { type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } },
      ],
      messages: [
        {
          role: 'user',
          content: `Title: ${clamp(title)}\nAbstract: ${clamp(abstract) || 'Not available'}\nJurisdiction: ${clamp(jurisdiction, 200) || 'Unknown'}`,
        },
      ],
    });

    if (message.stop_reason === 'max_tokens') {
      throw new UpstreamError('Summary was truncated.', { code: 'output_truncated' });
    }

    const parsed = parseJsonLoose(extractText(message));

    if (source === BYOK) {
      // A result paid for with one visitor's key must not be served to another.
      applyPrivacyHeaders(res, source);
    } else {
      // Owner-funded summaries of public documents change rarely; let the CDN
      // absorb repeat views instead of re-billing the same summary.
      res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    }
    return res.status(200).json(parsed);
  } catch (error) {
    console.error('radar-summarize error:', { code: error?.code, message: error?.message });
    const { status, body } = toClientError(error, source);
    applyPrivacyHeaders(res, source);
    return res.status(status).json(body);
  }
}
