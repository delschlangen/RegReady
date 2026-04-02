import { useState } from 'react';
import ExampleSelector from './ExampleSelector';
import LoadingSpinner from './LoadingSpinner';
import ResultCard from './ResultCard';
import RiskBadge from './RiskBadge';
import { riskScorerExamples } from '../examples/riskScorerExamples';
import { analyzeInput } from '../utils/api';

export default function RiskScorerTab() {
  const [input, setInput] = useState('');
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
      const data = await analyzeInput('riskScorer', input);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setTimeout(() => setCooldown(false), 5000);
    }
  }

  const tierBannerColors = {
    'Unacceptable': 'bg-gray-900 border-gray-900',
    'High Risk': 'bg-[#d93025] border-[#d93025]',
    'Limited Risk': 'bg-[#f9ab00] border-[#f9ab00]',
    'Minimal Risk': 'bg-[#34a853] border-[#34a853]',
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <ExampleSelector examples={riskScorerExamples} onSelect={setInput} />
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe an AI-powered product feature, use case, or system you want to assess..."
          rows={8}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 resize-y focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-transparent placeholder-gray-400"
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || loading || cooldown}
          className="mt-3 w-full sm:w-auto px-6 py-2.5 bg-[#1a73e8] text-white text-sm font-medium rounded-lg hover:bg-[#1557b0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {loading ? 'Scoring...' : 'Score Risk'}
        </button>
      </div>

      {loading && <LoadingSpinner message="Scoring risk profile..." />}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-700 font-medium">Analysis Error</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </div>
      )}

      {result && (
        <div>
          {/* Risk Classification Banner */}
          {result.riskClassification && (
            <div className={`rounded-lg p-6 mb-4 text-white ${tierBannerColors[result.riskClassification.tier] || 'bg-gray-500'}`}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl font-bold uppercase tracking-wide">
                  {result.riskClassification.tier}
                </span>
                <span className="text-sm opacity-80 bg-white/20 px-2 py-0.5 rounded">
                  Confidence: {result.riskClassification.confidence}
                </span>
              </div>
              <p className={`text-sm ${result.riskClassification.tier === 'Limited Risk' ? 'text-gray-800' : 'text-white/90'}`}>
                {result.riskClassification.justification}
              </p>
              <p className={`text-xs mt-2 ${result.riskClassification.tier === 'Limited Risk' ? 'text-gray-600' : 'text-white/60'}`}>
                Basis: {result.riskClassification.euAiActBasis}
              </p>
            </div>
          )}

          {/* Regulatory Exposure Matrix */}
          <ResultCard title="Regulatory Exposure Matrix">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Regulation</th>
                    <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Applicable</th>
                    <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Provisions</th>
                    <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Risk</th>
                    <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Key Obligations</th>
                  </tr>
                </thead>
                <tbody>
                  {result.regulatoryExposure?.map((reg, i) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 pr-4 font-medium text-gray-800 align-top">
                        <div>{reg.regulation}</div>
                        <div className="text-xs text-gray-400">{reg.jurisdiction}</div>
                      </td>
                      <td className="py-3 pr-4 align-top">
                        <span className={`text-xs font-medium ${reg.applicable ? 'text-[#d93025]' : 'text-gray-400'}`}>
                          {reg.applicable ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="py-3 pr-4 align-top">
                        <div className="flex flex-wrap gap-1">
                          {reg.provisionsTriggered?.map((p, j) => (
                            <span key={j} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 pr-4 align-top">
                        <RiskBadge label={reg.riskLevel} type="severity" />
                      </td>
                      <td className="py-3 align-top">
                        <ul className="space-y-1">
                          {reg.keyObligations?.map((o, j) => (
                            <li key={j} className="text-xs text-gray-600">{o}</li>
                          ))}
                        </ul>
                        {reg.penaltyExposure && (
                          <p className="text-xs text-[#d93025] mt-1">{reg.penaltyExposure}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ResultCard>

          {/* Vulnerability Flags */}
          <ResultCard title="Vulnerability Flags">
            <div className="space-y-3">
              {result.vulnerabilityFlags?.map((flag, i) => (
                <div
                  key={i}
                  className={`border-l-4 rounded-r-lg p-3 ${
                    flag.severity === 'Critical' ? 'border-l-gray-900 bg-gray-50' :
                    flag.severity === 'High' ? 'border-l-[#d93025] bg-red-50' :
                    flag.severity === 'Medium' ? 'border-l-[#f9ab00] bg-amber-50' :
                    'border-l-[#34a853] bg-green-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <RiskBadge label={flag.severity} type="severity" />
                    <span className="text-xs font-medium text-gray-700">{flag.category}</span>
                  </div>
                  <p className="text-sm text-gray-600">{flag.description}</p>
                  <p className="text-xs text-gray-400 mt-1">Basis: {flag.regulatoryBasis}</p>
                  {flag.compoundingRisk && (
                    <p className="text-xs text-amber-600 mt-1">Compounding: {flag.compoundingRisk}</p>
                  )}
                </div>
              ))}
            </div>
          </ResultCard>

          {/* Recommended Actions */}
          <ResultCard title="Recommended Actions">
            <div className="space-y-3">
              {result.recommendedActions?.map((action, i) => (
                <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className={`text-xs font-bold shrink-0 mt-0.5 ${
                    action.priority === 'P0' ? 'text-[#d93025]' :
                    action.priority === 'P1' ? 'text-[#e8710a]' :
                    action.priority === 'P2' ? 'text-[#f9ab00]' :
                    'text-[#34a853]'
                  }`}>
                    {action.priority}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{action.action}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{action.rationale}</p>
                    <div className="flex gap-3 mt-1.5">
                      <span className="text-xs text-gray-400">Owner: {action.owner}</span>
                      <span className="text-xs text-gray-400">Timeline: {action.timeline}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ResultCard>

          {/* Monitoring Indicators */}
          {result.monitoringIndicators?.length > 0 && (
            <ResultCard title="Monitoring Indicators" defaultOpen={false}>
              <div className="space-y-3">
                {result.monitoringIndicators.map((ind, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-800">{ind.indicator}</p>
                    <p className="text-xs text-gray-500 mt-1">Source: {ind.source}</p>
                    <p className="text-xs text-gray-500">Action: {ind.triggerAction}</p>
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
