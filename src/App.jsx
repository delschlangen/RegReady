import { useState } from 'react';
import Header from './components/Header';
import TabNav from './components/TabNav';
import TranslatorTab from './components/TranslatorTab';
import RiskScorerTab from './components/RiskScorerTab';
import RadarTab from './components/RadarTab';
import SaifTab from './components/SaifTab';

export default function App() {
  const [activeTab, setActiveTab] = useState('radar');
  const [prefill, setPrefill] = useState({ translator: '', riskScorer: '', saif: '' });

  function handleSendToTab(tab, text) {
    setPrefill((prev) => ({ ...prev, [tab]: text }));
    setActiveTab(tab);
  }

  function handleClearPrefill(tab) {
    setPrefill((prev) => ({ ...prev, [tab]: '' }));
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
      <Header />
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1">
        {activeTab === 'radar' && (
          <RadarTab onSendToTab={handleSendToTab} />
        )}
        {activeTab === 'translator' && (
          <TranslatorTab
            prefill={prefill.translator}
            onClearPrefill={() => handleClearPrefill('translator')}
            onSendToTab={handleSendToTab}
          />
        )}
        {activeTab === 'riskScorer' && (
          <RiskScorerTab
            prefill={prefill.riskScorer}
            onClearPrefill={() => handleClearPrefill('riskScorer')}
            onSendToTab={handleSendToTab}
          />
        )}
        {activeTab === 'saif' && (
          <SaifTab prefill={prefill.saif} onClearPrefill={() => handleClearPrefill('saif')} />
        )}
      </main>

      <footer className="border-t border-gray-200 bg-white py-4">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <span>Built by Del Schlangen | AI Governance & Compliance</span>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/delschlangen/regready"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-600 transition-colors"
            >
              GitHub
            </a>
            <span>Powered by Claude API — Anthropic</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
