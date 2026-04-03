export default function SaifGapCard({ rec }) {
  return (
    <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
      <span className={`text-xs font-bold shrink-0 mt-0.5 ${
        rec.priority === 'P0' ? 'text-[#d93025]' :
        rec.priority === 'P1' ? 'text-[#e8710a]' :
        'text-[#f9ab00]'
      }`}>
        {rec.priority}
      </span>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-800">{rec.gap}</p>
        <p className="text-sm text-gray-500 mt-0.5">{rec.recommendation}</p>
        {rec.implementationNotes && (
          <p className="text-xs text-gray-400 mt-1 italic">{rec.implementationNotes}</p>
        )}
        <div className="flex gap-3 mt-1.5">
          <span className="text-xs text-gray-400">Owner: {rec.owner}</span>
          <span className="text-xs text-gray-400">
            {rec.saifElement ? `Extends SAIF Element ${rec.saifElement}` : 'New Capability Required'}
          </span>
        </div>
      </div>
    </div>
  );
}
