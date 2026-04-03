import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const systemPrompt = `Given a legislative or regulatory item title and abstract, provide a JSON response with three fields: "summary" (2-3 sentence plain language explanation), "relevance" (High, Medium, or Low — how relevant is this to a major technology company building AI products), and "productImpact" (one sentence on which product areas are affected). Respond only in valid JSON.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, abstract, jurisdiction } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Missing required field: title' });
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Title: ${title}\nAbstract: ${abstract || 'Not available'}\nJurisdiction: ${jurisdiction || 'Unknown'}`,
        },
      ],
    });

    const rawText = message.content[0].text;
    const cleaned = rawText
      .replace(/^```(?:json)?\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .trim();

    const parsed = JSON.parse(cleaned);
    return res.status(200).json(parsed);
  } catch (error) {
    console.error('Summarization error:', error);

    if (error instanceof SyntaxError) {
      return res.status(502).json({
        error: 'Failed to parse AI summary as JSON',
        details: error.message,
      });
    }

    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      error: 'Failed to summarize item',
      details: error.message || String(error),
    });
  }
}
