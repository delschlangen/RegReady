import { useState } from 'react';

export default function ResultCard({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const text = document.getElementById(`card-${title}`)?.innerText || '';
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4 overflow-hidden">
      <div
        className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer select-none"
        onClick={() => setOpen(!open)}
      >
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleCopy(); }}
            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100 cursor-pointer"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <span className="text-gray-400 text-xs">{open ? '\u25B2' : '\u25BC'}</span>
        </div>
      </div>
      {open && (
        <div id={`card-${title}`} className="px-5 py-4">
          {children}
        </div>
      )}
    </div>
  );
}
