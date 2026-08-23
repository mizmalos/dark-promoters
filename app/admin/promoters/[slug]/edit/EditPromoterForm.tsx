'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { AustralianState, Promoter } from '@/lib/types';

const STATES: AustralianState[] = ['NSW', 'VIC', 'QLD', 'ACT'];

export default function EditPromoterForm({ promoter }: { promoter: Promoter }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get('name'),
      email: fd.get('email'),
      phone: fd.get('phone'),
      instagram: fd.get('instagram'),
      city: fd.get('city'),
      state: fd.get('state'),
      notes: fd.get('notes'),
      is_active: fd.get('is_active') === 'on',
    };
    const res = await fetch(`/api/admin/promoters/${promoter.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'Something went wrong.'); setLoading(false); return; }
    router.push(`/admin/promoters/${promoter.slug}`);
    router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href={`/admin/promoters/${promoter.slug}`}
          className="label-meta inline-flex items-center gap-1.5 transition-colors hover:text-[#F2F2EE] mb-4 block"
        >
          ← {promoter.name}
        </Link>
        <h1 className="page-title">Edit Promoter</h1>
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
            <input name="name" required defaultValue={promoter.name} className="dark-input" />
          </div>
          <Field label="Email" name="email" type="email" defaultValue={promoter.email ?? ''} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone" name="phone" defaultValue={promoter.phone ?? ''} />
          <Field label="Instagram Handle" name="instagram" placeholder="@handle" defaultValue={promoter.instagram ?? ''} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="City" name="city" defaultValue={promoter.city ?? ''} />
          <div>
            <label className="label-meta-2 block mb-2">State</label>
            <select name="state" defaultValue={promoter.state ?? ''} className="dark-select">
              <option value="">Select state</option>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-meta-2 block mb-2">Slug</label>
            <input value={promoter.slug} disabled className="dark-input" style={{ opacity: 0.5 }} />
            <p className="label-meta mt-1.5">Not editable — used in shareable links</p>
          </div>
          <div>
            <label className="label-meta-2 block mb-2">Promo Code</label>
            <input
              value={promoter.promo_code}
              disabled
              className="dark-input"
              style={{ opacity: 0.5, fontFamily: 'monospace', letterSpacing: '0.08em' }}
            />
            <p className="label-meta mt-1.5">Not editable — already live on Eventbrite</p>
          </div>
        </div>

        <div>
          <label className="label-meta-2 block mb-2">Notes</label>
          <textarea name="notes" rows={3} defaultValue={promoter.notes ?? ''} className="dark-textarea" />
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: '#888' }}>
          <input type="checkbox" name="is_active" defaultChecked={promoter.is_active} />
          Active
        </label>

        <div className="flex gap-3 pt-2" style={{ borderTop: '1px solid #1a1a1a' }}>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
          <Link href={`/admin/promoters/${promoter.slug}`} className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}

function Field({ label, name, type = 'text', required, placeholder, defaultValue }: {
  label: string; name: string; type?: string; required?: boolean; placeholder?: string; defaultValue?: string;
}) {
  return (
    <div>
      <label className="label-meta-2 block mb-2">{label}{required && <span style={{ color: '#B7FF00' }}> *</span>}</label>
      <input type={type} name={name} required={required} placeholder={placeholder} defaultValue={defaultValue} className="dark-input" />
    </div>
  );
}
