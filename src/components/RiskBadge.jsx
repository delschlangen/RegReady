const tierColors = {
  'Unacceptable': 'bg-gray-900 text-white',
  'High Risk': 'bg-[#d93025] text-white',
  'Limited Risk': 'bg-[#f9ab00] text-gray-900',
  'Minimal Risk': 'bg-[#34a853] text-white',
};

const severityColors = {
  'THRESHOLD': 'bg-[#9334e6] text-white',
  'Critical': 'bg-gray-900 text-white',
  'High': 'bg-[#d93025] text-white',
  'Medium': 'bg-[#f9ab00] text-gray-900',
  'Low': 'bg-[#34a853] text-white',
};

export default function RiskBadge({ label, type = 'tier' }) {
  const colors = type === 'tier' ? tierColors : severityColors;
  const colorClass = colors[label] || 'bg-gray-200 text-gray-700';

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
      {label}
    </span>
  );
}
