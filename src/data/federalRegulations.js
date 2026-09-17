// Curated US federal developments that the Federal Register API does not
// surface well (executive actions, cross-cutting policy). Live federal rules
// and notices still come from api/radar-federal.js.
// See stateRegulations.js for the shape and the meaning of `asOf` / `sources`.

export const federalRegulations = [
  {
    id: 'fed-curated-001',
    jurisdiction: 'United States (Federal)',
    jurisdictionType: 'US Federal',
    title: 'Executive Order — Ensuring a National Policy Framework for Artificial Intelligence',
    status: 'Executive Order',
    date: '2025-12-11',
    effectiveDate: '2025-12-11',
    asOf: '2026-09-17',
    url: 'https://www.whitehouse.gov/presidential-actions/2025/12/eliminating-state-law-obstruction-of-national-artificial-intelligence-policy/',
    summary: 'Directs the Attorney General to stand up a DOJ AI Litigation Task Force whose sole job is to challenge state AI laws deemed inconsistent with federal policy, on interstate commerce, preemption and First Amendment theories. Also directs work toward a preemptive federal standard, carving out child safety, compute and data-centre infrastructure, and state procurement, and encourages agencies to condition grants on states not enforcing conflicting AI laws.',
    relevance: 'High',
    productImpact: 'Every US state AI obligation now carries preemption risk. Build state compliance on the durable core — documented testing, notice and human review — rather than on state-specific artefacts that may not survive.',
    source: 'curated',
    sources: [
      'https://www.whitehouse.gov/presidential-actions/2025/12/eliminating-state-law-obstruction-of-national-artificial-intelligence-policy/',
      'https://www.skadden.com/insights/publications/2025/12/white-house-launches-national-framework',
      'https://www.sidley.com/en/insights/newsupdates/2025/12/unpacking-the-december-11-2025-executive-order',
    ],
  },
];
