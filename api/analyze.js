import { translatorSystemPrompt } from '../src/prompts/translatorPrompt.js';
import { riskScorerSystemPrompt } from '../src/prompts/riskScorerPrompt.js';
import { saifSystemPrompt } from '../src/prompts/saifPrompt.js';
import { callJson, toClientError, validateInput } from './_lib/claude.js';

// Exported so a test can assert production serves the same prompt text the app
// ships in src/prompts/ — these used to be duplicated inline here and drifted.
export const PROMPTS = {
  translator: translatorSystemPrompt,
  riskScorer: riskScorerSystemPrompt,
  saif: saifSystemPrompt,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', code: 'method_not_allowed' });
  }

  const { mode, input } = req.body || {};

  if (!mode || !input) {
    return res.status(400).json({
      error: 'Missing required fields: mode and input',
      code: 'missing_fields',
    });
  }

  if (!Object.prototype.hasOwnProperty.call(PROMPTS, mode)) {
    return res.status(400).json({
      error: 'Invalid mode. Must be "translator", "riskScorer", or "saif"',
      code: 'invalid_mode',
    });
  }

  const invalid = validateInput(input);
  if (invalid) {
    return res.status(400).json({ error: invalid, code: 'invalid_input' });
  }

  try {
    const parsed = await callJson({ system: PROMPTS[mode], input: input.trim() });
    return res.status(200).json(parsed);
  } catch (error) {
    console.error('analyze error:', { mode, message: error?.message });
    const { status, body } = toClientError(error);
    return res.status(status).json(body);
  }
}
