'use client';

import { useState } from 'react';

export function PushEventbriteButton({ promoterId }: { promoterId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handlePush() {
    setState('loading');
    setMessage('');
    try {
      const res = await fetch(`/api/admin/promoters/${promoterId}/push-eventbrite`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setState('error');
        setMessage(data.error ?? 'Failed to push to Eventbrite.');
      } else {
        setState('success');
        setMessage(data.note ?? `Code "${data.code}" is live.`);
      }
    } catch {
      setState('error');
      setMessage('Network error. Try again.');
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        onClick={handlePush}
        disabled={state === 'loading'}
        className="btn-secondary"
        style={state === 'success' ? { color: '#B7FF00', borderColor: 'rgba(183,255,0,0.3)' } : {}}
      >
        {state === 'loading' ? 'Pushing…' : state === 'success' ? '✓ On Eventbrite' : 'Push to Eventbrite'}
      </button>
      {message && (
        <p className="text-xs text-right" style={{ color: state === 'error' ? '#FF4444' : '#B7FF00' }}>
          {message}
        </p>
      )}
    </div>
  );
}

export function CopyLinkButton({ url, label }: { url: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="flex items-center gap-3 rounded-lg px-4 py-3"
      style={{ background: '#111', border: '1px solid #1E1E1E' }}
    >
      <span className="font-mono text-xs flex-1 truncate" style={{ color: '#777' }}>{label}</span>
      <button
        onClick={handleCopy}
        className="shrink-0 transition-colors text-xs font-semibold tracking-wide"
        style={{ color: copied ? '#B7FF00' : '#555' }}
      >
        {copied ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  );
}
