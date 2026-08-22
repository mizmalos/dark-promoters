'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AustralianState, Promoter } from '@/lib/types';

const STATES: AustralianState[] = ['NSW', 'VIC', 'QLD', 'ACT'];

interface Skipped {
  promoter_id: string;
  promoter_name: string;
  reason: string;
}

export default function BulkAssignPanel({
  eventId,
  unassigned,
}: {
  eventId: string;
  eventName: string;
  unassigned: Promoter[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<{ created: number; skipped: Skipped[] } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const cities = useMemo(
    () => Array.from(new Set(unassigned.map(p => p.city).filter((c): c is string => !!c))).sort(),
    [unassigned],
  );
  const states = useMemo(
    () => STATES.filter(s => unassigned.some(p => p.state === s)),
    [unassigned],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return unassigned.filter(p => {
      if (cityFilter && p.city !== cityFilter) return false;
      if (stateFilter && p.state !== stateFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.promo_code.toLowerCase().includes(q) ||
        (p.instagram ?? '').toLowerCase().includes(q)
      );
    });
  }, [unassigned, search, cityFilter, stateFilter]);

  const allFilteredSelected = filtered.length > 0 && filtered.every(p => selected.has(p.id));

  function toggleAllFiltered() {
    setSelected(prev => {
      const next = new Set(prev);
      if (allFilteredSelected) filtered.forEach(p => next.delete(p.id));
      else filtered.forEach(p => next.add(p.id));
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAssign() {
    setStatus('loading');
    setErrorMsg('');
    setResult(null);
    try {
      const res = await fetch('/api/admin/assignments/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, promoter_ids: Array.from(selected) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus('error');
        setErrorMsg(data.error ?? 'Failed to assign promoters.');
        return;
      }
      setStatus('done');
      setResult(data);
      setSelected(new Set());
      router.refresh();
    } catch {
      setStatus('error');
      setErrorMsg('Network error. Try again.');
    }
  }

  return (
    <div className="dark-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <p className="label-meta-2">Assign Promoters</p>
        <span className="label-meta">{unassigned.length} unassigned</span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search name, code, instagram…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="dark-input flex-1"
        />
        <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} className="dark-select sm:w-40">
          <option value="">All cities</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={stateFilter} onChange={e => setStateFilter(e.target.value)} className="dark-select sm:w-32">
          <option value="">All states</option>
          {states.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Select all + count */}
      <div className="flex items-center justify-between text-xs" style={{ color: '#777' }}>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={allFilteredSelected} onChange={toggleAllFiltered} />
          Select all filtered ({filtered.length})
        </label>
        <span>{selected.size} selected</span>
      </div>

      {/* Checklist */}
      <div className="rounded-lg overflow-y-auto" style={{ maxHeight: 420, border: '1px solid #1E1E1E' }}>
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-sm text-center" style={{ color: '#555' }}>No promoters match.</p>
        ) : (
          filtered.map(p => (
            <label
              key={p.id}
              className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors"
              style={{ borderBottom: '1px solid #161616' }}
            >
              <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} />
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-sm" style={{ color: '#F2F2EE' }}>{p.name}</span>
                {(p.city || p.state) && (
                  <span className="text-xs ml-2" style={{ color: '#555' }}>
                    {[p.city, p.state].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>
              <span className="font-mono text-xs font-semibold shrink-0" style={{ color: '#B7FF00' }}>{p.promo_code}</span>
            </label>
          ))
        )}
      </div>

      <button
        onClick={handleAssign}
        disabled={selected.size === 0 || status === 'loading'}
        className="btn-primary"
      >
        {status === 'loading' ? 'Assigning…' : `Assign ${selected.size} promoter${selected.size === 1 ? '' : 's'}`}
      </button>

      {status === 'error' && (
        <p className="text-xs" style={{ color: '#FF4444' }}>{errorMsg}</p>
      )}

      {status === 'done' && result && (
        <div className="space-y-2">
          {result.created > 0 && (
            <p className="text-sm" style={{ color: '#B7FF00' }}>
              ✓ Assigned {result.created} promoter{result.created === 1 ? '' : 's'}.
            </p>
          )}
          {result.skipped.length > 0 && (
            <div className="rounded-lg p-4 text-sm" style={{ background: 'rgba(255,180,0,0.06)', border: '1px solid rgba(255,180,0,0.2)' }}>
              <p className="font-semibold mb-2" style={{ color: '#FFB400' }}>
                {result.skipped.length} skipped
              </p>
              <ul className="space-y-1" style={{ color: '#888' }}>
                {result.skipped.map(s => (
                  <li key={s.promoter_id}>{s.promoter_name} — {s.reason}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
