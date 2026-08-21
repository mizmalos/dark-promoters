'use client';

import Image from 'next/image';
import { useState } from 'react';

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  background: '#111',
  border: '1px solid #1E1E1E',
  borderRadius: '0.5rem',
  padding: '0.75rem 1rem',
  fontSize: '0.875rem',
  color: '#F2F2EE',
  outline: 'none',
};

type AUState = 'NSW' | 'VIC' | 'QLD' | 'ACT' | '';

export default function JoinPage() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', instagram: '', city: '', state: '' as AUState,
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }));
  }

  function focusBorder(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    e.target.style.borderColor = 'rgba(183,255,0,0.3)';
  }
  function blurBorder(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    e.target.style.borderColor = '#1E1E1E';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    const res = await fetch('/api/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json() as { error?: string };

    if (!res.ok) {
      setStatus('error');
      setErrorMsg(data.error ?? 'Something went wrong. Try again.');
    } else {
      setStatus('success');
    }
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#070707' }}>
        <div className="text-center max-w-sm">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(183,255,0,0.08)', border: '1px solid rgba(183,255,0,0.2)' }}
          >
            <span style={{ color: '#B7FF00', fontSize: '1.75rem' }}>✓</span>
          </div>
          <p className="font-black text-2xl tracking-wide mb-3" style={{ color: '#F2F2EE' }}>
            You&apos;re in.
          </p>
          <p className="text-sm mb-4" style={{ color: '#555' }}>
            Check your inbox — we&apos;ve sent a sign-in link to{' '}
            <span style={{ color: '#888' }}>{form.email}</span>.
            Click it and you&apos;ll land straight in your dashboard.
          </p>
          <p className="text-xs" style={{ color: '#333' }}>
            No password needed, ever.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-12" style={{ background: '#070707' }}>
      <div className="max-w-sm mx-auto">
        {/* Logo */}
        <div className="text-center mb-10">
          <Image src="/dark-logo.png" alt="DARK" width={80} height={14} className="mx-auto mb-3" priority />
          <p className="label-meta">Become a Promoter</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#555' }}>
              Full Name <span style={{ color: '#B7FF00' }}>*</span>
            </label>
            <input
              type="text" required autoFocus
              placeholder="Josh Davies"
              value={form.name} onChange={field('name')}
              style={INPUT_STYLE}
              onFocus={focusBorder} onBlur={blurBorder}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#555' }}>
              Email <span style={{ color: '#B7FF00' }}>*</span>
            </label>
            <input
              type="email" required
              placeholder="josh@example.com"
              value={form.email} onChange={field('email')}
              style={INPUT_STYLE}
              onFocus={focusBorder} onBlur={blurBorder}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#555' }}>
              Phone
            </label>
            <input
              type="tel"
              placeholder="04XX XXX XXX"
              value={form.phone} onChange={field('phone')}
              style={INPUT_STYLE}
              onFocus={focusBorder} onBlur={blurBorder}
            />
          </div>

          {/* Instagram */}
          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#555' }}>
              Instagram
            </label>
            <input
              type="text"
              placeholder="@joshd"
              value={form.instagram} onChange={field('instagram')}
              style={INPUT_STYLE}
              onFocus={focusBorder} onBlur={blurBorder}
            />
          </div>

          {/* City + State */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#555' }}>
                City
              </label>
              <input
                type="text"
                placeholder="Melbourne"
                value={form.city} onChange={field('city')}
                style={INPUT_STYLE}
                onFocus={focusBorder} onBlur={blurBorder}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#555' }}>
                State
              </label>
              <select
                value={form.state} onChange={field('state')}
                style={{ ...INPUT_STYLE, appearance: 'none' }}
                onFocus={focusBorder} onBlur={blurBorder}
              >
                <option value="">Select…</option>
                <option value="VIC">VIC</option>
                <option value="NSW">NSW</option>
                <option value="QLD">QLD</option>
                <option value="ACT">ACT</option>
              </select>
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs" style={{ color: '#FF6666' }}>{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-3 rounded-lg font-black text-sm tracking-widest uppercase"
            style={{
              background: '#B7FF00',
              color: '#070707',
              opacity: status === 'loading' ? 0.6 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {status === 'loading' ? 'Submitting…' : 'Apply to Promote'}
          </button>

          <p className="text-center text-xs" style={{ color: '#333' }}>
            We&apos;ll email you a sign-in link right away. No password needed.
          </p>
        </form>

        <p className="text-center mt-8 text-xs" style={{ color: '#333' }}>
          Already a promoter?{' '}
          <a href="/portal" style={{ color: '#555' }} className="transition-colors hover:text-[#F2F2EE]">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
