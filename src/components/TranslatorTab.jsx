import { useState, useEffect } from 'react';
import ExampleSelector from './ExampleSelector';
import LoadingSpinner from './LoadingSpinner';
import ResultCard from './ResultCard';
import JiraTicket from './JiraTicket';
import { translatorExamples } from '../examples/translatorExamples';
import { analyzeInput } from '../utils/api';

export default function TranslatorTab({ prefill, onClearPrefill }) {
  const [input, setInput] = useState('');

  useEffect(() => {
    if (prefill) {
      setInput(prefill);
      onClearPrefill?.();
    }
  }, [prefill]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cooldown, setCooldown] = useState(false);

  async function handleSubmit() {
    if (!input.trim() || cooldown) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setCooldown(true);

    try {
      const data = await analyzeInput('translator', input);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setTimeout(() => setCooldown(false), 5000);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <ExampleSelector examples={translatorExamples} onSelect={setInput} />
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste a section of the EU AI Act, DSA, or any regulatory provision..."
          rows={8}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 resize-y focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-transparent placeholder-gray-400"
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || loading || cooldown}
          className="mt-3 w-full sm:w-auto px-6 py-2.5 bg-[#1a73e8] text-white text-sm font-medium rounded-lg hover:bg-[#1557b0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {loading ? 'Analyzing...' : 'Translate to Requirements'}
        </button>
      </div>

      {loading && <LoadingSpinner message="Analyzing regulatory text..." />}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-700 font-medium">Analysis Error</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </div>
      )}

      {result && (
        <div>
          <ResultCard title="Product Impact Summary">
            <p className="text-sm font-medium text-gray-800 mb-3">{result.impactSummary?.headline}</p>
            <ul className="space-y-2 mb-4">
              {result.impactSummary?.bullets?.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-[#1a73e8] mt-0.5 shrink-0">&#8226;</span>
                  {b}
                </li>
              ))}
            </ul>
            {result.impactSummary?.affectedProducts?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                <span className="text-xs text-gray-500 font-medium mr-1">Affected Products:</span>
                {result.impactSummary.affectedProducts.map((p, i) => (
                  <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                    {p}
                  </span>
                ))}
              </div>
            )}
            {result.impactSummary?.regulatorySource && (
              <p className="text-xs text-gray-400 mt-2">Source: {result.impactSummary.regulatorySource}</p>
            )}
          </ResultCard>

          <ResultCard title="Engineering Requirements">
            <div className="space-y-4">
              {result.requirements?.map((req) => (
                <div key={req.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-600">
                      {req.id}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      req.priority === 'Must Have'
                        ? 'bg-red-50 text-[#d93025]'
                        : req.priority === 'Should Have'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-green-50 text-green-700'
                    }`}>
                      {req.priority}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800 mt-2">{req.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{req.description}</p>
                  {req.affectedSystems?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {req.affectedSystems.map((s, i) => (
                        <span key={i} className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">Basis: {req.regulatoryBasis}</p>
                  {req.complianceDeadline && (
                    <p className="text-xs text-gray-400">Deadline: {req.complianceDeadline}</p>
                  )}
                </div>
              ))}
            </div>
          </ResultCard>

          <ResultCard title="Implementation Tickets">
            {result.jiraTickets?.map((ticket, i) => (
              <JiraTicket key={i} ticket={ticket} />
            ))}
          </ResultCard>

          {result.downstreamDependencies?.length > 0 && (
            <ResultCard title="Downstream Dependencies">
              <div className="space-y-3">
                {result.downstreamDependencies.map((dep, i) => (
                  <div
                    key={i}
                    className="border border-blue-100 rounded-lg overflow-hidden"
                  >
                    <div className="border-l-4 border-l-[#1a73e8] bg-[#e8f0fe] p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-blue-200 text-[#1a73e8]">
                          {dep.article}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 mt-1">{dep.obligation}</p>
                      <p className="text-sm text-gray-600 mt-1">{dep.relevance}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ResultCard>
          )}
        </div>
      )}
    </div>
  );
}
