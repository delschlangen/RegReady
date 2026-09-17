// Captures the README screenshots in docs/ from a local build.
// Run with: npm run build && npm run preview &   then: npm run shots
//
// Analysis tabs are shown with a stubbed API response so the shots are
// deterministic and cost nothing to regenerate.

import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, '../docs');
const BASE = process.env.PREVIEW_URL || 'http://localhost:4173';

const require = createRequire(import.meta.url);
let chromium;
for (const id of ['playwright', '/opt/node22/lib/node_modules/playwright/index.js']) {
  try {
    ({ chromium } = require(id));
    break;
  } catch {
    /* next */
  }
}
if (!chromium) {
  console.error('Playwright not found.');
  process.exit(1);
}

const RISK_FIXTURE = {
  riskClassification: {
    tier: 'High Risk',
    confidence: 'Medium',
    justification:
      'Resume screening that filters candidates before human review falls squarely within Annex III point 4(a): AI intended to be used for recruitment or selection, in particular to filter applications and evaluate candidates. Confidence is Medium rather than High because whether the system is a "substantial factor" or the decision-maker depends on how strictly the score-40 cutoff is applied in practice.',
    euAiActBasis: 'Article 6(2) and Annex III(4)(a)',
  },
  regulatoryExposure: [
    {
      regulation: 'EU AI Act (Regulation 2024/1689)',
      jurisdiction: 'European Union',
      applicable: true,
      provisionsTriggered: ['Art. 6(2)', 'Annex III(4)(a)', 'Art. 26(7)'],
      riskLevel: 'High',
      bindingAuthority: 'Binding Law',
      keyObligations: ['Conformity assessment', 'Human oversight', 'Worker notification'],
      penaltyExposure: 'Up to EUR 15M or 3% of global turnover',
    },
    {
      regulation: 'Illinois HB 3773 (Human Rights Act)',
      jurisdiction: 'Illinois, USA',
      applicable: true,
      provisionsTriggered: ['775 ILCS 5/2-102(L)'],
      riskLevel: 'High',
      bindingAuthority: 'Binding Law',
      keyObligations: ['No discriminatory effect', 'Employee notice'],
      penaltyExposure: 'Civil rights violation; IDHR enforcement',
    },
    {
      regulation: 'NIST AI Risk Management Framework 1.0',
      jurisdiction: 'United States',
      applicable: true,
      provisionsTriggered: ['GOVERN 1.1', 'MEASURE 2.11'],
      riskLevel: 'Medium',
      bindingAuthority: 'Voluntary Framework',
      keyObligations: ['Documented bias testing'],
      penaltyExposure: 'None directly; safe-harbour relevance under Texas TRAIGA',
    },
  ],
  vulnerabilityFlags: [
    {
      severity: 'High',
      category: 'Algorithmic Discrimination',
      description:
        'Training on historical hiring decisions from 50 clients reproduces those clients’ past selection patterns, including any protected-class skew.',
      regulatoryBasis: 'Annex III(4)(a); Title VII disparate impact',
      compoundingRisk: 'Illinois HB 3773 makes the same effect a civil rights violation independent of intent.',
    },
    {
      severity: 'THRESHOLD',
      category: 'Tier boundary',
      description:
        'If the score-40 cutoff were advisory and every candidate were reviewed, the system would arguably be a decision-support tool rather than a filter.',
      regulatoryBasis: 'Art. 6(3) derogation',
      compoundingRisk: null,
    },
  ],
  recommendedActions: [
    {
      priority: 'P0',
      action: 'Run a fundamental rights impact assessment before EU deployment',
      rationale: 'Article 27 is triggered by the Annex III classification.',
      owner: 'Legal',
      timeline: 'Pre-launch',
    },
    {
      priority: 'P1',
      action: 'Add a human review step for every candidate scored below the cutoff',
      rationale: 'Removes the strongest argument that the system decides rather than assists.',
      owner: 'Product',
      timeline: '30 days',
    },
  ],
  monitoringIndicators: [
    {
      indicator: 'IDHR finalises the HB 3773 notice rules',
      source: 'Illinois Department of Human Rights rulemaking',
      triggerAction: 'Align the candidate notice copy with the final text.',
    },
  ],
  downstreamDependencies: [
    {
      article: 'Article 27',
      obligation: 'Fundamental rights impact assessment',
      relevance: 'Conduct per ISO/IEC 42005:2025, the international standard for AI impact assessments.',
    },
    {
      article: 'Article 49',
      obligation: 'EU database registration',
      relevance: 'Annex III systems must be registered before being placed on the market.',
    },
  ],
  compliantPathSummary: {
    canBeDeployedAsIs: 'With Modifications',
    criticalBlockers: [
      'No human review for candidates below the cutoff',
      'No documented bias testing across protected classes',
      'No candidate notice in Illinois',
    ],
    modifiedVersion:
      'Keep the scoring model but make it advisory: surface scores with the factors behind them, require a recruiter decision on every candidate, publish bias-testing results per role family, and notify candidates that AI assists the screen.',
  },
};

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

await page.route('**/api/analyze', (r) =>
  r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(RISK_FIXTURE) }));
await page.route('**/api/radar-federal', (r) =>
  r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));

// 1. Regulatory Radar
await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/radar.png`, clip: { x: 0, y: 0, width: 1280, height: 900 } });
console.log('docs/radar.png');

// 2. Risk Triage Scorer with a result
await page.getByRole('button', { name: 'Risk Triage Scorer' }).click();
await page.locator('#panel-riskScorer textarea').fill(
  'We are developing an AI system that screens job applications for enterprise clients. It scores candidates 1-100 on job fit using a model trained on historical hiring data, and candidates scoring below 40 are typically not reviewed by a human. Deployed across the US, EU and UK.',
);
await page.getByRole('button', { name: 'Score Risk' }).click();
await page.waitForSelector('#panel-riskScorer >> text=HIGH RISK', { timeout: 15000 });
// Frame the result, not the empty input above it.
const y = await page.evaluate(() => {
  const el = [...document.querySelectorAll('#panel-riskScorer *')]
    .find((n) => n.textContent.trim().toUpperCase() === 'HIGH RISK' && n.children.length === 0);
  return el ? el.getBoundingClientRect().top + window.scrollY - 24 : 0;
});
await page.evaluate((top) => window.scrollTo(0, top), y);
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/risk-scorer.png` });
console.log('docs/risk-scorer.png');

await browser.close();
