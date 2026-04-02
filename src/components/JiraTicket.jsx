const priorityColors = {
  P0: 'text-[#d93025]',
  P1: 'text-[#e8710a]',
  P2: 'text-[#f9ab00]',
  P3: 'text-[#34a853]',
};

export default function JiraTicket({ ticket }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-3 last:mb-0">
      <div className="border-l-4 border-l-[#1a73e8] p-4">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
            {ticket.ticketId}
          </span>
          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
            {ticket.type}
          </span>
          <span className={`text-xs font-semibold ${priorityColors[ticket.priority] || 'text-gray-500'}`}>
            {ticket.priority}
          </span>
          {ticket.storyPoints && (
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">
              {ticket.storyPoints} pts
            </span>
          )}
        </div>

        <h4 className="text-sm font-semibold text-gray-900 mb-1">{ticket.title}</h4>
        <p className="text-sm text-gray-600 mb-3">{ticket.description}</p>

        {ticket.acceptanceCriteria?.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Acceptance Criteria
            </p>
            <ul className="space-y-1">
              {ticket.acceptanceCriteria.map((ac, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-gray-300 mt-0.5 shrink-0">&#9744;</span>
                  {ac}
                </li>
              ))}
            </ul>
          </div>
        )}

        {ticket.labels?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {ticket.labels.map((label, i) => (
              <span
                key={i}
                className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
