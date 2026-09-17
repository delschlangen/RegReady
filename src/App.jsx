import { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import TabNav from './components/TabNav';
import TranslatorTab from './components/TranslatorTab';
import RiskScorerTab from './components/RiskScorerTab';
import RadarTab from './components/RadarTab';
import SaifTab from './components/SaifTab';
import SettingsDialog from './components/SettingsDialog';
import { credentialMode } from './utils/credentials';

const TAB_TITLES = {
  radar: 'Regulatory Radar',
  translator: 'Reg → Reqs Translator',
  riskScorer: 'Risk Triage Scorer',
  saif: 'SAIF Mapper',
};

const VALID_TABS = Object.keys(TAB_TITLES);

function initialTab() {
  if (typeof window === 'undefined') return 'radar';
  const t = new URLSearchParams(window.location.search).get('tab');
  return VALID_TABS.includes(t) ? t : 'radar';
}

export default function App() {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [prefill, setPrefill] = useState({ translator: '', riskScorer: '', saif: '' });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [credMode, setCredMode] = useState(() => credentialMode());

  const openSettings = () => setSettingsOpen(true);

  // Tabs are mounted once visited and then hidden rather than unmounted.
  // Unmounting threw away an analysis the moment you switched tabs, which made
  // the cross-tab handoffs self-defeating: "Map to SAIF" cost you the risk
  // assessment you were reading.
  const visited = useRef(new Set([activeTab]));
  visited.current.add(activeTab);

  useEffect(() => {
    document.title = `${TAB_TITLES[activeTab] || 'RegReady'} — RegReady`;

    // Reflect the tab in the URL so it can be linked and the back button works.
    const url = new URL(window.location.href);
    if (url.searchParams.get('tab') !== activeTab) {
      if (activeTab === 'radar') url.searchParams.delete('tab');
      else url.searchParams.set('tab', activeTab);
      window.history.pushState({ tab: activeTab }, '', url);
    }
  }, [activeTab]);

  useEffect(() => {
    function onPop() {
      const t = new URLSearchParams(window.location.search).get('tab');
      setActiveTab(VALID_TABS.includes(t) ? t : 'radar');
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  function handleSendToTab(tab, text) {
    setPrefill((prev) => ({ ...prev, [tab]: text }));
    setActiveTab(tab);
  }

  function handleClearPrefill(tab) {
    setPrefill((prev) => ({ ...prev, [tab]: '' }));
  }

  const panels = {
    radar: <RadarTab onSendToTab={handleSendToTab} credMode={credMode} />,
    translator: (
      <TranslatorTab
        prefill={prefill.translator}
        onClearPrefill={() => handleClearPrefill('translator')}
        onSendToTab={handleSendToTab}
        onOpenSettings={openSettings}
      />
    ),
    riskScorer: (
      <RiskScorerTab
        prefill={prefill.riskScorer}
        onClearPrefill={() => handleClearPrefill('riskScorer')}
        onSendToTab={handleSendToTab}
        onOpenSettings={openSettings}
      />
    ),
    saif: (
      <SaifTab
        prefill={prefill.saif}
        onClearPrefill={() => handleClearPrefill('saif')}
        onSendToTab={handleSendToTab}
        onOpenSettings={openSettings}
      />
    ),
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
      <Header credMode={credMode} onOpenSettings={openSettings} />
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={() => setCredMode(credentialMode())}
      />

      <main className="flex-1">
        {VALID_TABS.filter((t) => visited.current.has(t)).map((t) => (
          <div key={t} hidden={t !== activeTab} id={`panel-${t}`} role="tabpanel">
            {panels[t]}
          </div>
        ))}
      </main>

      <footer className="border-t border-gray-200 bg-white py-4">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <span>Built by Del Schlangen | AI Governance &amp; Compliance</span>
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
