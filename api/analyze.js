import { translatorSystemPrompt } from '../src/prompts/translatorPrompt.js';
import { riskScorerSystemPrompt } from '../src/prompts/riskScorerPrompt.js';
import { saifSystemPrompt } from '../src/prompts/saifPrompt.js';
import { callJson, toClientError, validateInput } from './_lib/claude.js';
import { resolveCredentials, applyPrivacyHeaders } from './_lib/auth.js';
import { checkOrigin, checkCallRate, recordAuthFailure } from './_lib/guard.js';

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

  let source;
  try {
    checkOrigin(req);

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

    // Decide whose key pays for this before doing anything expensive.
    let creds;
    try {
      creds = resolveCredentials(req);
    } catch (authError) {
      // Rate-limit the guessing, not the asking: only a rejected credential
      // counts against the attempt budget.
      if (authError?.code === 'bad_passphrase' || authError?.code === 'malformed_key') {
        recordAuthFailure(req);
      }
      throw authError;
    }
    source = creds.source;

    checkCallRate(req, source);

    const parsed = await callJson({
      apiKey: creds.apiKey,
      system: PROMPTS[mode],
      input: input.trim(),
    });

    applyPrivacyHeaders(res, source);
    return res.status(200).json(parsed);
  } catch (error) {
    // Never log the error object itself — an SDK error can carry the request
    // headers, and those hold a caller's API key.
    console.error('analyze error:', { code: error?.code, message: error?.message });
    const { status, body } = toClientError(error, source);
    applyPrivacyHeaders(res, source);
    return res.status(status).json(body);
  }
}
