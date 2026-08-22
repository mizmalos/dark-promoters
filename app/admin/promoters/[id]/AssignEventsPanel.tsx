'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AustralianState, Event } from '@/lib/types';

const STATES: AustralianState[] = ['NSW', 'VIC', 'QLD', 'ACT'];

interface Skipped {
  event_id: string;
  event_name: string;
  reason: string;
}

export default function AssignEventsPanel({
  promoterId,
  unassignedEvents,
}: {
  promoterId: string;
  unassignedEvents: Event[];
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
    () => Array.from(new Set(unassignedEvents.map(e => e.city).filter((c): c is string => !!c))).sort(),
    [unassignedEvents],
  );
  const states = useMemo(
    () => STATES.filter(s => unassignedEvents.some(e => e.state === s)),
    [unassignedEvents],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return unassignedEvents.filter(e => {
      if (cityFilter && e.city !== cityFilter) return false;
      if (stateFilter && e.state !== stateFilter) return false;
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        (e.venue ?? '').toLowerCase().includes(q)
      );
    });
  }, [unassignedEvents, search, cityFilter, stateFilter]);

  const allFilteredSelected = filtered.length > 0 && filtered.every(e => selected.has(e.id));

  function toggleAllFiltered() {
    setSelected(prev => {
      const next = new Set(prev);
      if (allFilteredSelected) filtered.forEach(e => next.delete(e.id));
      else filtered.forEach(e => next.add(e.id));
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
      const res = await fetch(`/api/admin/promoters/${promoterId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_ids: Array.from(selected) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus('error');
        setErrorMsg(data.error ?? 'Failed to assign events.');
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
        <p className="label-meta-2">Assign to Event</p>
        <span className="label-meta">{unassignedEvents.length} available</span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search event, venue…"
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
      <div className="rounded-lg overflow-y-auto" style={{ maxHeight: 340, border: '1px solid #1E1E1E' }}>
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-sm text-center" style={{ color: '#555' }}>No events match.</p>
        ) : (
          filtered.map(e => {
            const dateStr = e.event_date
              ? new Date(e.event_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Melbourne' })
              : null;
            return (
              <label
                key={e.id}
                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors"
                style={{ borderBottom: '1px solid #161616' }}
              >
                <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggleOne(e.id)} />
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm" style={{ color: '#F2F2EE' }}>{e.name}</span>
                  {(e.venue || e.city || dateStr) && (
                    <span className="text-xs ml-2" style={{ color: '#555' }}>
                      {[e.venue, e.city, dateStr].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </div>
              </label>
            );
          })
        )}
      </div>

      <button
        onClick={handleAssign}
        disabled={selected.size === 0 || status === 'loading'}
        className="btn-primary"
      >
        {status === 'loading' ? 'Assigning…' : `Assign to ${selected.size} event${selected.size === 1 ? '' : 's'}`}
      </button>

      {status === 'error' && (
        <p className="text-xs" style={{ color: '#FF4444' }}>{errorMsg}</p>
      )}

      {status === 'done' && result && (
        <div className="space-y-2">
          {result.created > 0 && (
            <p className="text-sm" style={{ color: '#B7FF00' }}>
              ✓ Assigned to {result.created} event{result.created === 1 ? '' : 's'}.
            </p>
          )}
          {result.skipped.length > 0 && (
            <div className="rounded-lg p-4 text-sm" style={{ background: 'rgba(255,180,0,0.06)', border: '1px solid rgba(255,180,0,0.2)' }}>
              <p className="font-semibold mb-2" style={{ color: '#FFB400' }}>
                {result.skipped.length} skipped
              </p>
              <ul className="space-y-1" style={{ color: '#888' }}>
                {result.skipped.map(s => (
                  <li key={s.event_id}>{s.event_name} — {s.reason}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
