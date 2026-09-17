import { client, MODEL, extractText, parseJsonLoose, toClientError, UpstreamError } from './_lib/claude.js';

const systemPrompt = `Given a legislative or regulatory item title and abstract, provide a JSON response with three fields: "summary" (2-3 sentence plain language explanation), "relevance" (High, Medium, or Low — how relevant is this to an organization building or deploying AI products), and "productImpact" (one sentence on which product areas are affected). Respond only in valid JSON.`;

const MAX_FIELD = 4000;

function clamp(value, max = MAX_FIELD) {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', code: 'method_not_allowed' });
  }

  const { title, abstract, jurisdiction } = req.body || {};

  if (typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({
      error: 'Missing required field: title',
      code: 'missing_fields',
    });
  }

  try {
    const message = await client.messages.create({
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
    // Summaries are derived from public documents and change rarely; let the CDN
    // absorb repeat views instead of paying for the same summary on every load.
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json(parsed);
  } catch (error) {
    console.error('radar-summarize error:', error?.message);
    const { status, body } = toClientError(error);
    return res.status(status).json(body);
  }
}
