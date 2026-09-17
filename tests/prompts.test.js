import test from 'node:test';
import assert from 'node:assert/strict';

import { PROMPTS } from '../api/analyze.js';
import { translatorSystemPrompt } from '../src/prompts/translatorPrompt.js';
import { riskScorerSystemPrompt } from '../src/prompts/riskScorerPrompt.js';
import { saifSystemPrompt } from '../src/prompts/saifPrompt.js';

// api/analyze.js used to carry its own inline copies of these prompts, which
// silently drifted from src/prompts/ — several rules never reached production.
// Reference equality is the guard: a copy-paste can never satisfy it.
test('the API serves the exact prompts the app ships', () => {
  assert.equal(PROMPTS.translator, translatorSystemPrompt);
  assert.equal(PROMPTS.riskScorer, riskScorerSystemPrompt);
  assert.equal(PROMPTS.saif, saifSystemPrompt);
});

test('every mode the UI can request has a prompt', () => {
  assert.deepEqual(Object.keys(PROMPTS).sort(), ['riskScorer', 'saif', 'translator']);
  for (const [mode, prompt] of Object.entries(PROMPTS)) {
    assert.equal(typeof prompt, 'string', `${mode} prompt must be a string`);
    assert.ok(prompt.length > 500, `${mode} prompt looks truncated`);
  }
});

// Values the UI renders but the model only emits if the prompt asks for them.
test('prompts declare the schema values the UI renders', () => {
  assert.ok(
    riskScorerSystemPrompt.includes('THRESHOLD'),
    'RiskScorerTab and RiskBadge style a THRESHOLD severity that the prompt must produce',
  );
  assert.ok(
    riskScorerSystemPrompt.includes('compliantPathSummary'),
    'RiskScorerTab renders compliantPathSummary',
  );
  assert.ok(
    riskScorerSystemPrompt.includes('bindingAuthority'),
    'RiskScorerTab renders a bindingAuthority column',
  );
  assert.ok(
    riskScorerSystemPrompt.includes('downstreamDependencies'),
    'RiskScorerTab renders downstreamDependencies',
  );
  assert.ok(
    saifSystemPrompt.includes('crossFrameworkInsights'),
    'SaifTab renders crossFrameworkInsights',
  );
  assert.ok(
    translatorSystemPrompt.includes('jiraTickets'),
    'TranslatorTab renders jiraTickets',
  );
});

test('risk scorer rules are numbered contiguously from 1', () => {
  const numbers = [...riskScorerSystemPrompt.matchAll(/^(\d+)\. /gm)].map((m) => Number(m[1]));
  const rules = numbers.filter((n, i) => n === 1 ? i === numbers.indexOf(1) : true);
  const expected = Array.from({ length: rules.length }, (_, i) => i + 1);
  assert.deepEqual(rules, expected, `rule numbering has a gap or duplicate: ${rules.join(',')}`);
});

// Stale law in a compliance tool is worse than no law. These assertions fail
// loudly if someone reintroduces a superseded instrument as a live obligation.
test('prompts do not present superseded law as current', () => {
  for (const [mode, prompt] of Object.entries(PROMPTS)) {
    const mentionsOldColorado = /SB 24-205/.test(prompt);
    if (mentionsOldColorado) {
      assert.ok(
        /repeal|replaced|never took effect|superseded/i.test(prompt),
        `${mode} names Colorado SB 24-205 without noting it was repealed and replaced by SB 26-189`,
      );
    }
  }
});
