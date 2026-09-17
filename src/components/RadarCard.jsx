import { lifecycle } from '../utils/lifecycle';

const statusColors = {
  'Enacted': 'bg-[#34a853] text-white',
  'Effective': 'bg-[#34a853] text-white',
  'Rule': 'bg-[#1a73e8] text-white',
  'Proposed Rule': 'bg-[#f9ab00] text-gray-900',
  'Notice': 'bg-gray-200 text-gray-700',
  'Presidential Document': 'bg-[#9334e6] text-white',
  'Executive Order': 'bg-[#9334e6] text-white',
  'Guidance': 'bg-gray-200 text-gray-700',
  'Published': 'bg-[#1a73e8] text-white',
  'Repealed': 'bg-gray-900 text-white',
  'Enjoined': 'bg-[#d93025] text-white',
};

const relevanceColors = {
  'High': 'bg-red-50 text-[#d93025] border border-red-200',
  'Medium': 'bg-amber-50 text-amber-700 border border-amber-200',
  'Low': 'bg-gray-50 text-gray-500 border border-gray-200',
};

const lifecycleColors = {
  live: 'bg-green-50 text-green-700 border border-green-200',
  soon: 'bg-amber-50 text-amber-800 border border-amber-300',
  future: 'bg-gray-50 text-gray-600 border border-gray-200',
  dead: 'bg-gray-100 text-gray-500 border border-gray-300 line-through',
};

const jurisdictionBadge = (item) => {
  if (item.jurisdictionType === 'US Federal') return { label: 'US Federal', className: 'bg-[#1a73e8] text-white' };
  if (item.jurisdictionType === 'EU') return { label: 'EU', className: 'bg-[#003399] text-white' };
  if (item.jurisdictionType === 'International') return { label: 'International', className: 'bg-teal-700 text-white' };
  return { label: item.jurisdiction, className: 'bg-gray-700 text-white' };
};

export default function RadarCard({ item, onSendToTranslator, onSendToScorer }) {
  const badge = jurisdictionBadge(item);
  const statusColor = statusColors[item.status] || 'bg-gray-200 text-gray-700';
  const relevanceColor = relevanceColors[item.relevance] || relevanceColors['Low'];
  const phase = lifecycle(item);
  const superseded = item.status === 'Repealed' || item.status === 'Enjoined';

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${badge.className}`}>
          {badge.label}
        </span>
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusColor}`}>
          {item.status}
        </span>
        {phase && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded ${lifecycleColors[phase.tone]}`}
            title={phase.detail}
          >
            {phase.label}
          </span>
        )}
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${relevanceColor}`}>
          {item.relevance}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded ${item.source === 'curated' ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-500'}`}>
          {item.source === 'curated' ? 'Curated' : 'Live'}
        </span>
        <span className="text-xs text-gray-400 ml-auto">{item.date}</span>
      </div>

      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-semibold text-gray-800 hover:text-[#1a73e8] transition-colors"
      >
        {item.title}
      </a>

      <p className={`text-sm mt-2 ${superseded ? 'text-gray-500' : 'text-gray-600'}`}>
        {item.summary || item.abstract || 'Summary pending.'}
      </p>

      {item.productImpact && (
        <p className="text-sm text-gray-500 italic mt-2">{item.productImpact}</p>
      )}

      {item.agencies && item.agencies.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {item.agencies.map((a, i) => (
            <span key={i} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{a}</span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
        {item.effectiveDate && (
          <p className="text-xs text-gray-400">Effective: {item.effectiveDate}</p>
        )}
        {item.asOf && (
          <p className="text-xs text-gray-400">Verified: {item.asOf}</p>
        )}
        {item.sources?.length > 1 && (
          <p className="text-xs text-gray-400">
            {item.sources.length} sources
          </p>
        )}
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => onSendToTranslator(item)}
          className="text-xs px-3 py-1.5 bg-[#e8f0fe] text-[#1a73e8] font-medium rounded-lg hover:bg-[#d2e3fc] transition-colors cursor-pointer"
        >
          Analyze in Translator
        </button>
        <button
          onClick={() => onSendToScorer(item)}
          className="text-xs px-3 py-1.5 bg-red-50 text-[#d93025] font-medium rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
        >
          Score Risk
        </button>
      </div>
    </div>
  );
}
