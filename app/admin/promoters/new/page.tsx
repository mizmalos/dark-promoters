'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { AustralianState } from '@/lib/types';

const STATES: AustralianState[] = ['NSW', 'VIC', 'QLD', 'ACT'];

function nameToSlug(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function nameToPromoCode(name: string) {
  return name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 12);
}

export default function NewPromoterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [slug, setSlug] = useState('');
  const [promoCode, setPromoCode] = useState('');

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    setSlug(nameToSlug(name));
    setPromoCode(nameToPromoCode(name));
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

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black';

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/promoters" className="text-sm text-gray-500 hover:text-black">← Promoters</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Add Promoter</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              name="name" required onChange={handleNameChange}
              className={inputClass}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <select name="state" className={inputClass}>
              <option value="">Select state</option>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Auto-generated — shown read-only, editable if needed */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              name="slug" required value={slug} onChange={e => setSlug(e.target.value)}
              className={inputClass}
            />
            <p className="text-xs text-gray-400 mt-1">Auto-generated · edit if needed</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Promo Code</label>
            <input
              name="promo_code" required value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())}
              className={inputClass}
            />
            <p className="text-xs text-gray-400 mt-1">Auto-generated · edit if needed</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea name="notes" rows={3} className={inputClass} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="bg-black text-white text-sm px-5 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">
            {loading ? 'Saving…' : 'Save Promoter'}
          </button>
          <Link href="/admin/promoters"
            className="text-sm px-5 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            Cancel
          </Link>
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
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type} name={name} required={required} placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
      />
    </div>
  );
}
