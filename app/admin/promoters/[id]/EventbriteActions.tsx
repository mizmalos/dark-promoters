'use client';

import { useState } from 'react';

export function PushEventbriteButton({ promoterId }: { promoterId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error' | 'session_expired'>('idle');
  const [message, setMessage] = useState('');

  async function handlePush() {
    setState('loading');
    setMessage('');
    try {
      const res = await fetch(`/api/admin/promoters/${promoterId}/push-eventbrite`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'SESSION_EXPIRED') {
          setState('session_expired');
        } else {
          setState('error');
          setMessage(data.error ?? 'Failed to push to Eventbrite.');
        }
      } else {
        setState('success');
        setMessage('');
      }
    } catch {
      setState('error');
      setMessage('Network error. Try again.');
    }
  }

  return (
    <div className="flex flex-col items-end gap-2 w-full">
      <button
        onClick={handlePush}
        disabled={state === 'loading'}
        className="btn-secondary shrink-0"
        style={state === 'success' ? { color: '#B7FF00', borderColor: 'rgba(183,255,0,0.3)' } : {}}
      >
        {state === 'loading' ? 'Pushing…' : state === 'success' ? '✓ On Eventbrite' : 'Push to Eventbrite'}
      </button>

      {message && state === 'error' && (
        <p className="text-xs text-right" style={{ color: '#FF4444' }}>{message}</p>
      )}

      {state === 'session_expired' && (
        <div className="w-full mt-2 rounded-lg p-4 text-sm" style={{ background: 'rgba(255,180,0,0.06)', border: '1px solid rgba(255,180,0,0.2)' }}>
          <p className="font-semibold mb-2" style={{ color: '#FFB400' }}>⚠ Eventbrite session expired</p>
          <p className="mb-3" style={{ color: '#888' }}>Refresh it locally — no redeploy needed:</p>
          <ol className="space-y-1 list-decimal list-inside" style={{ color: '#777' }}>
            <li>Open Eventbrite → any event → Promotions tab</li>
            <li>Open DevTools (Cmd+Option+I) → Network tab</li>
            <li>Create any promo code → find the <code style={{ color: '#aaa' }}>discounts/</code> POST request</li>
            <li>Headers → Request Headers → right-click <code style={{ color: '#aaa' }}>Cookie</code> → Copy value</li>
            <li>Run <code style={{ color: '#aaa' }}>node scripts/refresh-eventbrite-session.mjs</code> locally and paste it in</li>
          </ol>
          <p className="mt-3 text-xs" style={{ color: '#555' }}>Takes effect immediately — try again as soon as the script confirms.</p>
        </div>
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
