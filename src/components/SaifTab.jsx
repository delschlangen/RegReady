import { useState, useEffect } from 'react';
import ExampleSelector from './ExampleSelector';
import LoadingSpinner from './LoadingSpinner';
import ResultCard from './ResultCard';
import SaifRadarChart from './SaifRadarChart';
import SaifMatrix from './SaifMatrix';
import SaifGapCard from './SaifGapCard';
import { saifExamples } from '../examples/saifExamples';
import { analyzeInput } from '../utils/api';

export default function SaifTab({ prefill, onClearPrefill }) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cooldown, setCooldown] = useState(false);

  useEffect(() => {
    if (prefill) {
      setInput(prefill);
      onClearPrefill?.();
    }
  }, [prefill]);

  async function handleSubmit() {
    if (!input.trim() || cooldown) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setCooldown(true);

    try {
      const data = await analyzeInput('saif', input);
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
        <ExampleSelector examples={saifExamples} onSelect={setInput} />
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste a regulatory provision to map against Google's SAIF framework..."
          rows={8}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 resize-y focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-transparent placeholder-gray-400"
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || loading || cooldown}
          className="mt-3 w-full sm:w-auto px-6 py-2.5 bg-[#1a73e8] text-white text-sm font-medium rounded-lg hover:bg-[#1557b0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {loading ? 'Mapping...' : 'Map to SAIF'}
        </button>
      </div>

      {loading && <LoadingSpinner message="Mapping regulatory requirements to SAIF..." />}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-700 font-medium">Analysis Error</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </div>
      )}

      {result && (
        <div>
          {/* Regulatory Context Banner */}
          {result.regulatoryContext && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-4">
              <p className="text-sm font-semibold text-gray-800">{result.regulatoryContext.regulation}</p>
              <p className="text-xs text-gray-500 mt-1">Jurisdiction: {result.regulatoryContext.jurisdiction}</p>
              <p className="text-sm text-gray-600 mt-2">{result.regulatoryContext.coreObligation}</p>
            </div>
          )}

          {/* SAIF Coverage Radar Chart */}
          {result.saifMapping && result.overallAssessment && (
            <ResultCard title="SAIF Coverage Analysis">
              <SaifRadarChart
                saifMapping={result.saifMapping}
                complianceReadiness={result.overallAssessment.complianceReadiness}
              />
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">{result.overallAssessment.summary}</p>
                <p className="text-xs text-gray-400 mt-2">
                  Strongest alignment: {result.overallAssessment.strongestAlignment}
                </p>
              </div>
              {result.overallAssessment.criticalGaps?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Critical Gaps</p>
                  <ul className="space-y-1">
                    {result.overallAssessment.criticalGaps.map((g, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#d93025]">
                        <span className="mt-0.5 shrink-0">&#10005;</span>
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </ResultCard>
          )}

          {/* SAIF Element Mapping Matrix */}
          {result.saifMapping && (
            <ResultCard title="SAIF Element Mapping">
              <SaifMatrix saifMapping={result.saifMapping} />
            </ResultCard>
          )}

          {/* Gap Recommendations */}
          {result.gapRecommendations?.length > 0 && (
            <ResultCard title="Gap Recommendations">
              <div className="space-y-3">
                {result.gapRecommendations.map((rec, i) => (
                  <SaifGapCard key={i} rec={rec} />
                ))}
              </div>
            </ResultCard>
          )}

          {/* Cross-Framework Insights */}
          {result.crossFrameworkInsights?.length > 0 && (
            <ResultCard title="Cross-Framework Insights" defaultOpen={false}>
              <div className="space-y-3">
                {result.crossFrameworkInsights.map((insight, i) => (
                  <div key={i} className="border-l-4 border-l-[#1a73e8] bg-[#e8f0fe] rounded-r-lg p-4">
                    <p className="text-sm font-medium text-gray-800">{insight.insight}</p>
                    <p className="text-xs text-gray-500 mt-1">{insight.relevance}</p>
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
