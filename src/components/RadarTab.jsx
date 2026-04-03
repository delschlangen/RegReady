import { useState, useEffect } from 'react';
import RadarCard from './RadarCard';
import RadarFilters from './RadarFilters';
import { stateRegulations } from '../data/stateRegulations';
import { euRegulations } from '../data/euRegulations';

const SKELETON_COUNT = 3;

function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 animate-pulse">
      <div className="flex gap-2 mb-3">
        <div className="h-5 w-20 bg-gray-200 rounded-full" />
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
        <div className="h-5 w-14 bg-gray-200 rounded" />
      </div>
      <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
      <div className="h-3 w-full bg-gray-100 rounded mb-1" />
      <div className="h-3 w-5/6 bg-gray-100 rounded mb-1" />
      <div className="h-3 w-2/3 bg-gray-100 rounded" />
    </div>
  );
}

export default function RadarTab({ onSendToTab }) {
  const [federalItems, setFederalItems] = useState([]);
  const [federalLoading, setFederalLoading] = useState(true);
  const [federalError, setFederalError] = useState(null);
  const [summaryCache, setSummaryCache] = useState({});
  const [summarizing, setSummarizing] = useState(new Set());

  const [filters, setFilters] = useState({
    jurisdictions: ['US Federal', 'US States', 'EU'],
    status: 'All',
    relevance: 'All',
  });

  useEffect(() => {
    fetchFederalData();
  }, []);

  // Summarize federal items that don't have summaries yet
  useEffect(() => {
    const unsummarized = federalItems.filter(
      (item) => !item.summary && !summaryCache[item.id] && !summarizing.has(item.id)
    );
    if (unsummarized.length === 0) return;

    let cancelled = false;
    async function summarizeSequentially() {
      for (const item of unsummarized) {
        if (cancelled) break;
        setSummarizing((prev) => new Set([...prev, item.id]));
        try {
          const res = await fetch('/api/radar-summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: item.title,
              abstract: item.abstract || '',
              jurisdiction: item.jurisdiction,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            setSummaryCache((prev) => ({ ...prev, [item.id]: data }));
          }
        } catch {
          // Silently skip failed summaries
        }
        setSummarizing((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
        // 5s cooldown between calls
        if (!cancelled) await new Promise((r) => setTimeout(r, 5000));
      }
    }
    summarizeSequentially();
    return () => { cancelled = true; };
  }, [federalItems, summaryCache, summarizing]);

  async function fetchFederalData() {
    setFederalLoading(true);
    setFederalError(null);
    try {
      const res = await fetch('/api/radar-federal');
      if (!res.ok) throw new Error(`Federal Register API returned ${res.status}`);
      const data = await res.json();
      setFederalItems(data);
    } catch (err) {
      setFederalError(err.message);
    } finally {
      setFederalLoading(false);
    }
  }

  // Merge all items, apply summaries from cache
  const allItems = [
    ...stateRegulations,
    ...euRegulations,
    ...federalItems.map((item) => {
      const cached = summaryCache[item.id];
      if (cached) {
        return {
          ...item,
          summary: cached.summary,
          relevance: cached.relevance || item.relevance || 'Medium',
          productImpact: cached.productImpact || item.productImpact,
        };
      }
      return item;
    }),
  ];

  // Filter
  const filtered = allItems.filter((item) => {
    // Jurisdiction filter
    const jMatch =
      (filters.jurisdictions.includes('US States') && item.jurisdictionType === 'US State') ||
      (filters.jurisdictions.includes('US Federal') && item.jurisdictionType === 'US Federal') ||
      (filters.jurisdictions.includes('EU') && item.jurisdictionType === 'EU');
    if (!jMatch) return false;

    // Status filter
    if (filters.status !== 'All') {
      const statusMap = {
        'Enacted': ['Enacted', 'Effective'],
        'Proposed': ['Proposed Rule', 'Notice'],
        'Guidance': ['Guidance', 'Published'],
      };
      const allowed = statusMap[filters.status] || [];
      if (!allowed.includes(item.status)) return false;
    }

    // Relevance filter
    if (filters.relevance === 'High' && item.relevance !== 'High') return false;
    if (filters.relevance === 'High + Medium' && !['High', 'Medium'].includes(item.relevance)) return false;

    return true;
  });

  // Sort reverse chronological
  const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));

  function handleSendToTranslator(item) {
    const text = `${item.title}\n\n${item.summary || item.abstract || ''}`;
    onSendToTab('translator', text);
  }

  function handleSendToScorer(item) {
    const text = `Evaluate the regulatory risk for an AI product affected by the following regulation:\n\n${item.title}\n\n${item.summary || item.abstract || ''}\n\nJurisdiction: ${item.jurisdiction}`;
    onSendToTab('riskScorer', text);
  }

  const now = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Regulatory Radar</h2>
        <p className="text-sm text-gray-500 mt-1">AI regulatory developments — rolling 30-day view</p>
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <span className="text-xs text-gray-400">Last updated: {now}</span>
          <span className="text-xs text-gray-400">|</span>
          <span className="text-xs text-gray-400">State legislation and EU data are manually curated. Federal items update automatically.</span>
        </div>
      </div>

      <RadarFilters filters={filters} onFilterChange={setFilters} />

      {federalError && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <p className="text-xs text-amber-700">
            Live federal data temporarily unavailable. Showing curated data only.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {sorted.map((item) => (
          <RadarCard
            key={item.id}
            item={item}
            onSendToTranslator={handleSendToTranslator}
            onSendToScorer={handleSendToScorer}
          />
        ))}

        {federalLoading && (
          <>
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <SkeletonCard key={`skel-${i}`} />
            ))}
          </>
        )}

        {!federalLoading && sorted.length === 0 && (
          <div className="text-center py-12 text-sm text-gray-400">
            No items match the current filters.
          </div>
        )}
      </div>
    </div>
  );
}
