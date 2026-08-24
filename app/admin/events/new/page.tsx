'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { AustralianState } from '@/lib/types';

const STATES: AustralianState[] = ['NSW', 'VIC', 'QLD', 'ACT'];

export default function NewEventPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    const res = await fetch('/api/admin/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'Something went wrong.'); setLoading(false); return; }
    router.push(`/admin/events/${data.slug}`);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/admin/events" className="label-meta inline-flex items-center gap-1.5 transition-colors hover:text-[#F2F2EE] mb-4 block">
          ← Events
        </Link>
        <h1 className="page-title">Add Event</h1>
      </div>

      <form onSubmit={handleSubmit} className="dark-card p-6 space-y-5">
        {error && (
          <div className="text-sm px-4 py-3 rounded-lg" style={{ background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)', color: '#FF4444' }}>
            {error}
          </div>
        )}

        <Field label="Event Name" name="name" required />

        <div>
          <label className="label-meta-2 block mb-2">Description</label>
          <textarea name="description" rows={2} className="dark-textarea" />
        </div>

        <Field label="Venue" name="venue" />

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

        <Field label="Event Date" name="event_date" type="datetime-local" />

        <Field
          label="Eventbrite URL"
          name="eventbrite_url"
          required
          placeholder="https://www.eventbrite.com.au/e/..."
          helpText="Paste the full Eventbrite URL — discount codes are appended automatically"
        />

        <Field
          label="Eventbrite Event ID"
          name="eventbrite_event_id"
          placeholder="e.g. 1997952526791"
          helpText="The numeric ID from the Eventbrite URL"
        />

        <div className="flex gap-3 pt-2" style={{ borderTop: '1px solid #1a1a1a' }}>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving…' : 'Save Event'}
          </button>
          <Link href="/admin/events" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}

function Field({ label, name, type = 'text', required, placeholder, helpText }: {
  label: string; name: string; type?: string; required?: boolean; placeholder?: string; helpText?: string;
}) {
  return (
    <div>
      <label className="label-meta-2 block mb-2">{label}{required && <span style={{ color: '#B7FF00' }}> *</span>}</label>
      <input type={type} name={name} required={required} placeholder={placeholder} className="dark-input" />
      {helpText && <p className="label-meta mt-1.5">{helpText}</p>}
    </div>
  );
}
