export default function RadarFilters({ filters, onFilterChange }) {
  const jurisdictionOptions = ['US Federal', 'US States', 'EU'];
  const statusOptions = ['All', 'Enacted', 'Proposed', 'Guidance'];
  const relevanceOptions = ['All', 'High', 'High + Medium'];

  function toggleJurisdiction(j) {
    const current = filters.jurisdictions;
    const next = current.includes(j) ? current.filter((x) => x !== j) : [...current, j];
    if (next.length > 0) onFilterChange({ ...filters, jurisdictions: next });
  }

  return (
    <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Jurisdiction</span>
        {jurisdictionOptions.map((j) => (
          <button
            key={j}
            onClick={() => toggleJurisdiction(j)}
            className={`text-xs px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
              filters.jurisdictions.includes(j)
                ? 'bg-[#1a73e8] text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {j}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</span>
        {statusOptions.map((s) => (
          <button
            key={s}
            onClick={() => onFilterChange({ ...filters, status: s })}
            className={`text-xs px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
              filters.status === s
                ? 'bg-[#1a73e8] text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Relevance</span>
        {relevanceOptions.map((r) => (
          <button
            key={r}
            onClick={() => onFilterChange({ ...filters, relevance: r })}
            className={`text-xs px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
              filters.relevance === r
                ? 'bg-[#1a73e8] text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}
