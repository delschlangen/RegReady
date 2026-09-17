const DAY = 24 * 60 * 60 * 1000;

/**
 * Derive what a regulation's dates actually mean today, rather than trusting a
 * hand-typed status that goes stale the moment a deadline passes.
 * Returns null when there is nothing honest to say (e.g. live federal items).
 */
export function lifecycle(item, now = new Date()) {
  if (!item) return null;

  if (item.status === 'Repealed') {
    return { label: 'Repealed', tone: 'dead', detail: 'No longer in force' };
  }
  if (item.status === 'Enjoined') {
    return { label: 'Enjoined', tone: 'dead', detail: 'Blocked by a court' };
  }

  const effective = parseDate(item.effectiveDate);
  if (!effective) return null;

  const days = Math.ceil((effective.getTime() - startOfDay(now).getTime()) / DAY);

  if (days <= 0) {
    return { label: 'In force', tone: 'live', detail: `Since ${formatDate(effective)}` };
  }
  if (days <= 90) {
    return {
      label: `In ${days} day${days === 1 ? '' : 's'}`,
      tone: 'soon',
      detail: `Applies from ${formatDate(effective)}`,
    };
  }
  return {
    label: `From ${formatDate(effective)}`,
    tone: 'future',
    detail: `${days} days away`,
  };
}

function parseDate(value) {
  if (typeof value !== 'string') return null;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  // Construct in local time so the day count is not shifted by the timezone.
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatDate(d) {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
