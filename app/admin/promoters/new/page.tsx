'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { AustralianState } from '@/lib/types';

const STATES: AustralianState[] = ['NSW', 'VIC', 'QLD', 'ACT'];

function nameToSlug(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function NewPromoterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [slug, setSlug] = useState('');
  const [promoCode, setPromoCode] = useState('');

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlug(nameToSlug(e.target.value));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    const res = await fetch('/api/admin/promoters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'Something went wrong.'); setLoading(false); return; }
    router.push(`/admin/promoters/${data.id}`);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/admin/promoters" className="label-meta inline-flex items-center gap-1.5 transition-colors hover:text-[#F2F2EE] mb-4 block">
          ← Promoters
        </Link>
        <h1 className="page-title">Add Promoter</h1>
      </div>

      <form onSubmit={handleSubmit} className="dark-card p-6 space-y-5">
        {error && (
          <div className="text-sm px-4 py-3 rounded-lg" style={{ background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)', color: '#FF4444' }}>
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-meta-2 block mb-2">
              Full Name <span style={{ color: '#B7FF00' }}>*</span>
            </label>
            <input
              name="name"
              required
              onChange={handleNameChange}
              className="dark-input"
            />
          </div>
          <Field label="Email" name="email" type="email" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone" name="phone" />
          <Field label="Instagram Handle" name="instagram" placeholder="@handle" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="City" name="city" />
          <div>
            <label className="label-meta-2 block mb-2">State</label>
            <select name="state" className="dark-select">
              <option value="">Select state</option>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-meta-2 block mb-2">Slug <span style={{ color: '#B7FF00' }}>*</span></label>
            <input
              name="slug"
              required
              value={slug}
              onChange={e => setSlug(e.target.value)}
              className="dark-input"
            />
            <p className="label-meta mt-1.5">Auto-generated from name · edit if needed</p>
          </div>
          <div>
            <label className="label-meta-2 block mb-2">Promo Code <span style={{ color: '#B7FF00' }}>*</span></label>
            <input
              name="promo_code"
              required
              value={promoCode}
              onChange={e => setPromoCode(e.target.value.toUpperCase())}
              placeholder="e.g. MADDIE"
              className="dark-input"
              style={{ fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }}
            />
            <p className="label-meta mt-1.5">Enter a custom code · auto-creates $5 discount on Eventbrite</p>
          </div>
        </div>

        <div>
          <label className="label-meta-2 block mb-2">Notes</label>
          <textarea name="notes" rows={3} className="dark-textarea" />
        </div>

        <div className="flex gap-3 pt-2" style={{ borderTop: '1px solid #1a1a1a' }}>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving…' : 'Save Promoter'}
          </button>
          <Link href="/admin/promoters" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}

function Field({ label, name, type = 'text', required, placeholder }: {
  label: string; name: string; type?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="label-meta-2 block mb-2">{label}{required && <span style={{ color: '#B7FF00' }}> *</span>}</label>
      <input type={type} name={name} required={required} placeholder={placeholder} className="dark-input" />
    </div>
  );
}
