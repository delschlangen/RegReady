import test from 'node:test';
import assert from 'node:assert/strict';

import { stateRegulations, CURATED_AS_OF } from '../src/data/stateRegulations.js';
import { euRegulations } from '../src/data/euRegulations.js';
import { federalRegulations } from '../src/data/federalRegulations.js';
import { lifecycle } from '../src/utils/lifecycle.js';

const ALL = [...stateRegulations, ...euRegulations, ...federalRegulations];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const JURISDICTION_TYPES = new Set(['US State', 'US Federal', 'EU', 'International']);
const STATUSES = new Set([
  'Enacted', 'Effective', 'Published', 'Guidance',
  'Proposed Rule', 'Notice', 'Executive Order',
  'Repealed', 'Enjoined',
]);

test('every curated entry has a well-formed shape', () => {
  for (const item of ALL) {
    const where = `${item.id} (${item.title})`;
    assert.ok(item.id, `${where}: missing id`);
    assert.ok(item.title, `${where}: missing title`);
    assert.ok(item.summary?.length > 40, `${where}: summary too short to be useful`);
    assert.ok(item.productImpact, `${where}: missing productImpact`);
    assert.ok(
      JURISDICTION_TYPES.has(item.jurisdictionType),
      `${where}: jurisdictionType "${item.jurisdictionType}" is not one the Radar filter knows`,
    );
    assert.ok(STATUSES.has(item.status), `${where}: unknown status "${item.status}"`);
    assert.ok(ISO_DATE.test(item.date), `${where}: date must be YYYY-MM-DD`);
    assert.ok(['High', 'Medium', 'Low'].includes(item.relevance), `${where}: bad relevance`);
    assert.match(item.url, /^https:\/\//, `${where}: url must be https`);
    if (item.effectiveDate !== null && item.effectiveDate !== undefined) {
      assert.ok(ISO_DATE.test(item.effectiveDate), `${where}: effectiveDate must be YYYY-MM-DD or null`);
    }
    assert.ok(ISO_DATE.test(item.asOf), `${where}: needs an asOf verification date`);
    assert.ok(item.sources?.length > 0, `${where}: needs at least one source URL`);
    for (const src of item.sources) {
      assert.match(src, /^https:\/\//, `${where}: source must be https`);
    }
  }
});

test('entry ids are unique', () => {
  const ids = ALL.map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length, `duplicate id in ${ids.join(', ')}`);
});

test('CURATED_AS_OF is a real date and not in the future', () => {
  assert.ok(ISO_DATE.test(CURATED_AS_OF));
  assert.ok(new Date(CURATED_AS_OF) <= new Date(), 'curated-as-of date is in the future');
});

// The whole point of the Radar is that it does not state repealed law as live.
test('superseded instruments are marked, not left as Enacted', () => {
  const byId = (id) => stateRegulations.find((i) => i.id === id);

  const colorado24 = byId('state-002');
  assert.ok(colorado24, 'the repealed Colorado AI Act entry should still be listed for context');
  assert.match(colorado24.title, /SB 24-205/);
  assert.equal(colorado24.status, 'Repealed');
  assert.equal(colorado24.effectiveDate, null, 'a repealed law has no effective date');

  const ab2655 = byId('state-003');
  assert.match(ab2655.title, /AB 2655/);
  assert.equal(ab2655.status, 'Enjoined');
  assert.equal(ab2655.effectiveDate, null);

  // And the replacement must be present, or the tool tells only half the story.
  const colorado26 = byId('state-007');
  assert.ok(colorado26, 'SB 26-189 replaced SB 24-205 and must be listed');
  assert.match(colorado26.title, /SB 26-189/);
  assert.equal(colorado26.effectiveDate, '2027-01-01');
});

test('lifecycle derives status from dates', () => {
  const now = new Date(2026, 8, 17); // 2026-09-17

  assert.equal(lifecycle({ status: 'Repealed' }, now).tone, 'dead');
  assert.equal(lifecycle({ status: 'Enjoined' }, now).tone, 'dead');

  assert.equal(
    lifecycle({ status: 'Enacted', effectiveDate: '2026-01-01' }, now).tone,
    'live',
  );
  assert.equal(
    lifecycle({ status: 'Enacted', effectiveDate: '2026-10-01' }, now).tone,
    'soon',
  );
  assert.equal(
    lifecycle({ status: 'Enacted', effectiveDate: '2027-01-01' }, now).tone,
    'future',
  );

  // Live federal items carry no effectiveDate and should not get a badge.
  assert.equal(lifecycle({ status: 'Notice' }, now), null);
  assert.equal(lifecycle(null, now), null);
});

test('lifecycle day counts do not drift by timezone', () => {
  const now = new Date(2026, 8, 17);
  const phase = lifecycle({ status: 'Enacted', effectiveDate: '2026-09-18' }, now);
  assert.equal(phase.label, 'In 1 day');
});
