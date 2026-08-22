'use client';

import { useState } from 'react';

export function InviteButton({ promoterId }: { promoterId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleInvite() {
    setState('loading');
    setMessage('');
    try {
      const res = await fetch(`/api/admin/promoters/${promoterId}/invite`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setState('error');
        setMessage(data.error ?? 'Failed to send invite.');
      } else {
        setState('success');
      }
    } catch {
      setState('error');
      setMessage('Network error. Try again.');
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleInvite}
        disabled={state === 'loading'}
        className="btn-secondary shrink-0"
        style={state === 'success' ? { color: '#B7FF00', borderColor: 'rgba(183,255,0,0.3)' } : {}}
      >
        {state === 'loading' ? 'Sending…' : state === 'success' ? '✓ Invite Sent' : 'Send Portal Invite'}
      </button>
      {message && state === 'error' && (
        <p className="text-xs text-right" style={{ color: '#FF4444' }}>{message}</p>
      )}
    </div>
  );
}
