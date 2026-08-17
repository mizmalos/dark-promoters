'use client';

import { useState } from 'react';

export function ShareButton({ url, eventName }: { url: string; eventName: string }) {
  const [state, setState] = useState<'idle' | 'copied'>('idle');

  async function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: `DARK — ${eventName}`, url });
        return;
      } catch {
        // user cancelled or not supported — fall through to copy
      }
    }
    await navigator.clipboard.writeText(url);
    setState('copied');
    setTimeout(() => setState('idle'), 2500);
  }

  return (
    <button
      onClick={handleShare}
      className="btn-primary w-full justify-center"
      style={{ fontSize: '0.7rem', letterSpacing: '0.1em' }}
    >
      {state === 'copied' ? '✓ LINK COPIED' : 'SHARE LINK'}
    </button>
  );
}

export function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <button
      onClick={handleCopy}
      className="btn-secondary"
      style={copied ? { color: '#B7FF00', borderColor: 'rgba(183,255,0,0.3)', padding: '8px 18px' } : { padding: '8px 18px' }}
    >
      {copied ? '✓ Copied' : 'Copy Code'}
    </button>
  );
}
