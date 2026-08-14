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
    router.push(`/admin/events/${data.id}`);
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/events" className="text-sm text-gray-500 hover:text-black">← Events</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Add Event</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

        <Field label="Event Name *" name="name" required />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea name="description" rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
        </div>
        <Field label="Venue" name="venue" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="City" name="city" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <select name="state" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black">
              <option value="">Select state</option>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <Field label="Event Date" name="event_date" type="datetime-local" />
        <Field
          label="Eventbrite Base URL *"
          name="eventbrite_url"
          required
          placeholder="https://www.eventbrite.com.au/e/..."
          helpText="Paste the full Eventbrite event URL — discount codes are appended automatically"
        />
        <Field
          label="Eventbrite Event ID"
          name="eventbrite_event_id"
          placeholder="e.g. 1988138282121"
          helpText="The numeric ID from the Eventbrite URL (for future API sync)"
        />

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="bg-black text-white text-sm px-5 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">
            {loading ? 'Saving…' : 'Save Event'}
          </button>
          <Link href="/admin/events"
            className="text-sm px-5 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            Cancel
          </Link>
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
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type} name={name} required={required} placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
      />
      {helpText && <p className="text-xs text-gray-400 mt-1">{helpText}</p>}
    </div>
  );
}
