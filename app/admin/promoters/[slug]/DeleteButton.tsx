'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function DeleteButton({
  promoterId,
  promoterName,
  eventCount,
  ticketCount,
}: {
  promoterId: string;
  promoterName: string;
  eventCount: number;
  ticketCount: number;
}) {
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'confirming' | 'loading' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleDelete() {
    setState('loading');
    setMessage('');
    try {
      const res = await fetch(`/api/admin/promoters/${promoterId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setState('error');
        setMessage(data.error ?? 'Failed to delete promoter.');
        return;
      }
      router.push('/admin/promoters');
      router.refresh();
    } catch {
      setState('error');
      setMessage('Network error. Try again.');
    }
  }

  if (state === 'idle' || state === 'error') {
    return (
      <div className="flex flex-col items-end gap-2">
        <button
          onClick={() => setState('confirming')}
          className="btn-secondary"
          style={{ color: '#FF4444', borderColor: 'rgba(255,68,68,0.3)' }}
        >
          Delete Promoter
        </button>
        {message && <p className="text-xs text-right" style={{ color: '#FF4444' }}>{message}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-3 max-w-sm">
      <p className="text-sm text-right" style={{ color: '#F2F2EE' }}>
        Delete <span className="font-semibold">{promoterName}</span> permanently? This removes their promo code
        {eventCount > 0 && <> and all {eventCount} event assignment{eventCount === 1 ? '' : 's'}</>}
        {ticketCount > 0 && <> (including {ticketCount} recorded ticket sale{ticketCount === 1 ? '' : 's'})</>}
        . This cannot be undone.
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setState('idle')}
          disabled={state === 'loading'}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={state === 'loading'}
          className="btn-secondary"
          style={{ color: '#FF4444', borderColor: 'rgba(255,68,68,0.4)', background: 'rgba(255,68,68,0.06)' }}
        >
          {state === 'loading' ? 'Deleting…' : 'Confirm Delete'}
        </button>
      </div>
    </div>
  );
}
