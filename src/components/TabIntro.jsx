// A first-time visitor landed on a bare textarea with a placeholder and had to
// infer what the tab does and what "good" input looks like. This states the
// job, the output, and offers one-click examples instead of a hidden dropdown.

export default function TabIntro({ title, what, youGet, examples, onSelect }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold text-gray-800">{title}</h2>
      <p className="text-sm text-gray-600 mt-1 max-w-3xl">{what}</p>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
        {youGet.map((item) => (
          <li key={item} className="text-xs text-gray-500 flex items-center gap-1.5">
            <span className="text-[#34a853]" aria-hidden="true">&#10003;</span>
            {item}
          </li>
        ))}
      </ul>

      {examples?.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="text-xs text-gray-400">Try:</span>
          {examples.map((ex, i) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => onSelect(ex.text)}
              title={ex.label}
              className="text-xs px-2.5 py-1 rounded-full bg-[#e8f0fe] text-[#1a73e8] font-medium hover:bg-[#d2e3fc] transition-colors cursor-pointer"
            >
              {ex.short || ex.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
