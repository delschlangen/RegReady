const JURISDICTIONS = ['US Federal', 'US States', 'EU', 'International'];
const STATUSES = ['All', 'In force', 'Upcoming', 'Proposed', 'Guidance', 'Superseded'];
const RELEVANCE = ['All', 'High', 'High + Medium'];

function Chip({ active, onClick, children, pressed }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={`text-xs px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
        active
          ? 'bg-[#1a73e8] text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

// Each row wraps independently. A single flex row of chips overflowed the
// viewport on a phone and scrolled the whole page sideways.
function Row({ label, children }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide w-full sm:w-auto sm:mr-1">
        {label}
      </span>
      {children}
    </div>
  );
}

export default function RadarFilters({ filters, onFilterChange }) {
  function toggleJurisdiction(j) {
    const current = filters.jurisdictions;
    const next = current.includes(j) ? current.filter((x) => x !== j) : [...current, j];
    // Never let the user filter everything away — an empty Radar reads as broken.
    if (next.length > 0) onFilterChange({ ...filters, jurisdictions: next });
  }

  return (
    <div className="flex flex-col gap-3 mb-4 p-3 bg-white rounded-lg border border-gray-200">
      <Row label="Jurisdiction">
        {JURISDICTIONS.map((j) => (
          <Chip
            key={j}
            active={filters.jurisdictions.includes(j)}
            pressed={filters.jurisdictions.includes(j)}
            onClick={() => toggleJurisdiction(j)}
          >
            {j}
          </Chip>
        ))}
      </Row>

      <Row label="Status">
        {STATUSES.map((s) => (
          <Chip
            key={s}
            active={filters.status === s}
            pressed={filters.status === s}
            onClick={() => onFilterChange({ ...filters, status: s })}
          >
            {s}
          </Chip>
        ))}
      </Row>

      <Row label="Relevance">
        {RELEVANCE.map((r) => (
          <Chip
            key={r}
            active={filters.relevance === r}
            pressed={filters.relevance === r}
            onClick={() => onFilterChange({ ...filters, relevance: r })}
          >
            {r}
          </Chip>
        ))}
      </Row>
    </div>
  );
}
