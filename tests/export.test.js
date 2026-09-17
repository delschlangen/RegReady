import test from 'node:test';
import assert from 'node:assert/strict';

import { toMarkdown, filenameFor } from '../src/utils/exportResult.js';

const RISK = {
  riskClassification: {
    tier: 'High Risk',
    confidence: 'Medium',
    justification: 'Annex III point 4 employment screening.',
    euAiActBasis: 'Annex III(4)(a)',
  },
  regulatoryExposure: [
    {
      regulation: 'EU AI Act',
      jurisdiction: 'EU',
      bindingAuthority: 'Binding Law',
      riskLevel: 'High',
      provisionsTriggered: ['Art. 6', 'Annex III(4)'],
      keyObligations: ['Conformity assessment'],
      penaltyExposure: 'Up to EUR 15M or 3% turnover',
    },
  ],
  vulnerabilityFlags: [
    {
      severity: 'THRESHOLD',
      category: 'Tier boundary',
      description: 'Could be Limited Risk if advisory only.',
      regulatoryBasis: 'Art. 6(3)',
      compoundingRisk: null,
    },
  ],
  recommendedActions: [
    { priority: 'P0', action: 'Run a FRIA', rationale: 'Art. 27', owner: 'Legal', timeline: 'Pre-launch' },
  ],
  downstreamDependencies: [
    { article: 'Art. 27', obligation: 'FRIA', relevance: 'Triggered by Annex III' },
  ],
  compliantPathSummary: {
    canBeDeployedAsIs: 'With Modifications',
    criticalBlockers: ['No human review step'],
    modifiedVersion: 'Add a reviewer in the loop.',
  },
};

const TRANSLATOR = {
  impactSummary: {
    headline: 'Transparency duties apply.',
    bullets: ['Label AI output', 'Publish a policy'],
    affectedProducts: ['Chat — response labelling'],
    regulatorySource: 'EU AI Act Article 50',
  },
  requirements: [
    {
      id: 'REQ-001',
      title: 'Label AI responses',
      description: 'Attach a visible marker.',
      priority: 'Must Have',
      affectedSystems: ['Web'],
      regulatoryBasis: 'Art. 50(1)',
      complianceDeadline: '2026-08-02',
    },
  ],
  jiraTickets: [
    {
      ticketId: 'COMPLY-1',
      title: 'Add marker',
      type: 'Feature',
      priority: 'P0',
      description: 'Render a badge.',
      acceptanceCriteria: ['Badge shows on every AI reply'],
      labels: ['ai-act'],
      storyPoints: 3,
    },
  ],
  downstreamDependencies: [],
};

const SAIF = {
  regulatoryContext: { regulation: 'EU AI Act Art. 15', jurisdiction: 'EU', coreObligation: 'Be robust.' },
  saifMapping: [
    {
      element: 1,
      elementName: 'Security Foundations',
      coverage: 'Partially Addressed',
      explanation: 'Covers input sanitisation.',
      specificControls: ['Input validation'],
      gaps: ['No accuracy metric'],
    },
  ],
  overallAssessment: {
    complianceReadiness: 55,
    strongestAlignment: 'Element 1',
    criticalGaps: ['Accuracy declaration'],
    summary: 'Partial coverage.',
  },
  gapRecommendations: [
    {
      gap: 'No accuracy metric',
      saifElement: 6,
      recommendation: 'Publish metrics',
      owner: 'Engineering',
      priority: 'P1',
      implementationNotes: 'Add to the model card.',
    },
  ],
  crossFrameworkInsights: [{ insight: 'ISO 42005 operationalises Element 6.', relevance: 'Gives a method.' }],
};

test('risk scorer markdown carries the fields the UI shows', () => {
  const md = toMarkdown('riskScorer', RISK);
  for (const needle of [
    'High Risk',
    'Annex III(4)(a)',
    'Binding Law',
    'THRESHOLD',
    'Run a FRIA',
    'Art. 27',
    'With Modifications',
    'No human review step',
    'not legal advice',
  ]) {
    assert.ok(md.includes(needle), `markdown is missing "${needle}"`);
  }
});

test('translator markdown carries requirements and tickets', () => {
  const md = toMarkdown('translator', TRANSLATOR);
  for (const needle of ['REQ-001', 'Must Have', 'COMPLY-1', 'Badge shows on every AI reply', '2026-08-02']) {
    assert.ok(md.includes(needle), `markdown is missing "${needle}"`);
  }
});

test('saif markdown carries coverage, gaps and cross-framework insight', () => {
  const md = toMarkdown('saif', SAIF);
  for (const needle of ['55/100', 'Security Foundations', 'Partially Addressed', 'ISO 42005', 'Publish metrics']) {
    assert.ok(md.includes(needle), `markdown is missing "${needle}"`);
  }
});

test('serializers survive missing and empty fields', () => {
  for (const mode of ['translator', 'riskScorer', 'saif']) {
    assert.doesNotThrow(() => toMarkdown(mode, {}));
    assert.equal(toMarkdown(mode, null), '');
  }
  assert.equal(toMarkdown('nope', RISK), '');
  // An array field arriving as undefined must not produce "undefined" in output.
  const md = toMarkdown('riskScorer', { riskClassification: { tier: 'Minimal Risk' } });
  assert.ok(!md.includes('undefined'), 'undefined leaked into the markdown');
});

test('filenames are slugged and bounded', () => {
  assert.equal(filenameFor('riskScorer', RISK), 'regready-risk-assessment-high-risk');
  assert.equal(
    filenameFor('translator', TRANSLATOR),
    'regready-requirements-eu-ai-act-article-50',
  );
  assert.equal(filenameFor('saif', {}), 'regready-saif-mapping');
  const long = filenameFor('saif', { regulatoryContext: { regulation: 'x'.repeat(200) } });
  assert.ok(long.length < 70, 'filename should be bounded');
});
