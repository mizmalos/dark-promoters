'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-client';

export default function MagicLinkForm({ next }: { next?: string }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const redirectTo =
    typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ''}`
      : `/auth/callback`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setState('loading');
    setErrorMsg('');

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: false, // only let registered promoters in
      },
    });

    if (error) {
      setState('error');
      setErrorMsg(error.message);
    } else {
      setState('sent');
    }
  }

  if (state === 'sent') {
    return (
      <div className="text-center">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: 'rgba(183,255,0,0.08)', border: '1px solid rgba(183,255,0,0.2)' }}
        >
          <span style={{ color: '#B7FF00', fontSize: '1.5rem' }}>✓</span>
        </div>
        <p className="font-semibold mb-2" style={{ color: '#F2F2EE' }}>Check your inbox</p>
        <p className="text-sm" style={{ color: '#555' }}>
          We sent a sign-in link to{' '}
          <span style={{ color: '#888' }}>{email}</span>.
          <br />No password needed — just click the link.
        </p>
        <button
          onClick={() => setState('idle')}
          className="mt-6 text-xs transition-colors hover:text-[#F2F2EE]"
          style={{ color: '#444' }}
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-xs font-semibold tracking-widest uppercase mb-2"
          style={{ color: '#555' }}
        >
          Your Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoFocus
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="dark-input"
        />
      </div>

      {state === 'error' && (
        <p className="text-xs" style={{ color: '#FF6666' }}>{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={state === 'loading' || !email.trim()}
        className="w-full py-3 rounded-lg font-black text-sm tracking-widest uppercase transition-opacity"
        style={{
          background: '#B7FF00',
          color: '#070707',
          opacity: state === 'loading' || !email.trim() ? 0.5 : 1,
        }}
      >
        {state === 'loading' ? 'Sending…' : 'Send Sign-In Link'}
      </button>

      <p className="text-center text-xs" style={{ color: '#333' }}>
        No password needed. We'll email you a one-click link.
      </p>
    </form>
  );
}
