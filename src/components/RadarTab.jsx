import { useState, useEffect, useRef } from 'react';
import RadarCard from './RadarCard';
import RadarFilters from './RadarFilters';
import { stateRegulations, CURATED_AS_OF } from '../data/stateRegulations';
import { euRegulations } from '../data/euRegulations';
import { federalRegulations } from '../data/federalRegulations';
import { lifecycle } from '../utils/lifecycle';

const SKELETON_COUNT = 3;
// Federal items without an abstract get a Claude summary. Bounded per load so a
// noisy Federal Register day cannot turn one page view into a large API bill.
const MAX_SUMMARIES_PER_LOAD = 6;
const SUMMARY_COOLDOWN_MS = 1200;

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
  const [federalFetchedAt, setFederalFetchedAt] = useState(null);
  const attemptedRef = useRef(new Set());

  const [filters, setFilters] = useState({
    jurisdictions: ['US Federal', 'US States', 'EU', 'International'],
    status: 'All',
    relevance: 'All',
  });

  useEffect(() => {
    fetchFederalData();
  }, []);

  // Summarize federal items that have no abstract to fall back on.
  //
  // This effect must depend ONLY on federalItems. It previously also depended on
  // summaryCache and summarizing — the same state it sets — so every write
  // restarted it, the loop never reached its cooldown, and a page load fanned
  // out into ~20 concurrent Claude calls that retried failures indefinitely.
  // attemptedRef survives re-renders without triggering them, so each item is
  // tried exactly once per mount whether it succeeds or fails.
  useEffect(() => {
    const pending = federalItems.filter(
      (item) => !item.summary && !item.abstract && !attemptedRef.current.has(item.id),
    );
    if (pending.length === 0) return;

    let cancelled = false;

    async function summarizeSequentially() {
      for (const item of pending.slice(0, MAX_SUMMARIES_PER_LOAD)) {
        if (cancelled) break;
        attemptedRef.current.add(item.id);
        setSummarizing((prev) => new Set(prev).add(item.id));
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
            if (!cancelled) setSummaryCache((prev) => ({ ...prev, [item.id]: data }));
          }
        } catch {
          // A failed summary is not worth retrying — the card still renders
          // its title, link and agencies.
        }
        setSummarizing((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
        if (!cancelled) await new Promise((r) => setTimeout(r, SUMMARY_COOLDOWN_MS));
      }
    }

    summarizeSequentially();
    return () => { cancelled = true; };
  }, [federalItems]);

  async function fetchFederalData() {
    setFederalLoading(true);
    setFederalError(null);
    try {
      const res = await fetch('/api/radar-federal');
      if (!res.ok) throw new Error(`Federal Register API returned ${res.status}`);
      const data = await res.json();
      setFederalItems(Array.isArray(data) ? data : []);
      setFederalFetchedAt(new Date());
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
    ...federalRegulations,
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
      (filters.jurisdictions.includes('EU') && item.jurisdictionType === 'EU') ||
      (filters.jurisdictions.includes('International') && item.jurisdictionType === 'International');
    if (!jMatch) return false;

    // Status filter — driven by what the dates actually mean today, so an
    // "Enacted" item whose date has passed reads as in force, not as pending.
    if (filters.status !== 'All') {
      const phase = lifecycle(item);
      const bucket =
        phase?.tone === 'dead' ? 'Superseded'
        : phase?.tone === 'live' ? 'In force'
        : phase ? 'Upcoming'
        : ['Proposed Rule', 'Notice'].includes(item.status) ? 'Proposed'
        : ['Guidance', 'Published'].includes(item.status) ? 'Guidance'
        : null;
      const alsoProposed = filters.status === 'Proposed' && ['Proposed Rule', 'Notice'].includes(item.status);
      const alsoGuidance = filters.status === 'Guidance' && ['Guidance', 'Published'].includes(item.status);
      if (bucket !== filters.status && !alsoProposed && !alsoGuidance) return false;
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

  // Each source has its own freshness — a single render-time clock would imply
  // the curated entries were re-verified on page load, which they were not.
  const federalFetchedLabel = federalFetchedAt
    ? federalFetchedAt.toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : federalLoading ? 'loading…' : 'unavailable';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Regulatory Radar</h2>
        <p className="text-sm text-gray-500 mt-1">
          Curated AI regulatory milestones, plus the last 30 days of US federal activity
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
          <span className="text-xs text-gray-400">
            Curated entries verified {CURATED_AS_OF}
          </span>
          <span className="text-xs text-gray-300">|</span>
          <span className="text-xs text-gray-400">
            Federal Register fetched {federalFetchedLabel}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Every curated card links its sources. Not legal advice — verify against the primary text before relying on it.
        </p>
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
