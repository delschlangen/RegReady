import { useState } from 'react';

const coverageBadge = {
  'Fully Addressed': 'bg-[#34a853] text-white',
  'Partially Addressed': 'bg-[#f9ab00] text-gray-900',
  'Gap': 'bg-[#d93025] text-white',
};

export default function SaifMatrix({ saifMapping }) {
  const [expanded, setExpanded] = useState({});

  function toggle(element) {
    setExpanded((prev) => ({ ...prev, [element]: !prev[element] }));
  }

  return (
    <div className="space-y-2">
      {saifMapping.map((item) => {
        const isOpen = expanded[item.element];
        return (
          <div
            key={item.element}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggle(item.element)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer text-left"
            >
              <span className="w-7 h-7 rounded-full bg-[#1a73e8] text-white text-xs font-bold flex items-center justify-center shrink-0">
                {item.element}
              </span>
              <span className="text-sm font-medium text-gray-800 flex-1">
                {item.elementName}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${coverageBadge[item.coverage] || 'bg-gray-200 text-gray-700'}`}>
                {item.coverage}
              </span>
              <span className="text-gray-400 text-xs">{isOpen ? '\u25B2' : '\u25BC'}</span>
            </button>

            {isOpen && (
              <div className="px-4 py-3 border-t border-gray-100">
                <p className="text-sm text-gray-600 mb-3">{item.explanation}</p>

                {item.specificControls?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Controls</p>
                    <div className="flex flex-wrap gap-1">
                      {item.specificControls.map((c, i) => (
                        <span key={i} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-200">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {item.gaps?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Gaps</p>
                    <ul className="space-y-1">
                      {item.gaps.map((g, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-[#d93025]">
                          <span className="mt-0.5 shrink-0">&#10005;</span>
                          {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
