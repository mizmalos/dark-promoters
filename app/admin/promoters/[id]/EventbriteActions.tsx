'use client';

import { useState } from 'react';

export function PushEventbriteButton({ promoterId }: { promoterId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handlePush() {
    setState('loading');
    setMessage('');
    try {
      const res = await fetch(`/api/admin/promoters/${promoterId}/push-eventbrite`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        setState('error');
        setMessage(data.error ?? 'Failed to push to Eventbrite.');
      } else {
        setState('success');
        setMessage(data.note ?? `Code "${data.code}" is live on Eventbrite.`);
      }
    } catch {
      setState('error');
      setMessage('Network error. Try again.');
    }
  }

  return (
    <div>
      <button
        onClick={handlePush}
        disabled={state === 'loading'}
        className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        {state === 'loading' ? 'Pushing…' : state === 'success' ? '✓ On Eventbrite' : 'Push to Eventbrite'}
      </button>
      {message && (
        <p className={`text-xs mt-1 ${state === 'error' ? 'text-red-600' : 'text-green-600'}`}>
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
    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
      <span className="text-xs font-mono text-gray-600 truncate flex-1">{label}</span>
      <button
        onClick={handleCopy}
        className="text-xs text-gray-500 hover:text-black shrink-0 transition-colors"
      >
        {copied ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  );
}
