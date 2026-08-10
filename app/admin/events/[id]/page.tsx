import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/mock-db';
import { countValidTickets, buildEventbriteUrl, suggestLinkSlug } from '@/lib/utils/tickets';

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = db.events.withPromoters(id);
  if (!event) notFound();

  const allPromoters = db.promoters.list().filter(p => p.is_active);
  const assignedIds  = new Set(event.promoter_events.map(pe => pe.promoter_id));
  const unassigned   = allPromoters.filter(p => !assignedIds.has(p.id));

  const eventDate = event.event_date
    ? new Date(event.event_date).toLocaleDateString('en-AU', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne',
      })
    : null;

  const totalTickets = event.promoter_events.reduce((sum, pe) => {
    return sum + countValidTickets(db.sales.forAssignment(pe.id));
  }, 0);

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link href="/admin/events" className="text-sm text-gray-500 hover:text-black">← Events</Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${event.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {event.is_active ? 'Live on Eventbrite' : 'Inactive'}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {event.venue && `${event.venue} · `}{event.city}, {event.state}
          {eventDate && ` · ${eventDate}`}
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Promoters', value: event.promoter_events.length },
          { label: 'Valid Tickets', value: totalTickets },
          { label: 'Eventbrite ID', value: event.eventbrite_event_id ?? '—' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Assigned promoters */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Assigned Promoters</h2>
        </div>

        {event.promoter_events.length === 0 ? (
          <p className="px-6 py-10 text-sm text-gray-400 text-center">No promoters assigned yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Promoter', 'Code', 'Link Slug', 'Valid Tickets', 'Eventbrite Checkout', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {event.promoter_events.map(pe => {
                const sales   = db.sales.forAssignment(pe.id);
                const tickets = countValidTickets(sales);
                const ebUrl   = buildEventbriteUrl(event.eventbrite_url, pe.promoter.promo_code);
                return (
                  <tr key={pe.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <Link href={`/admin/promoters/${pe.promoter_id}`} className="font-medium text-gray-900 hover:underline">
                        {pe.promoter.name}
                      </Link>
                      <div className="text-xs text-gray-400">{pe.promoter.city}</div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-gray-700">{pe.promoter.promo_code}</td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-600">
                      /m/{pe.link_slug}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-black text-white">
                        {tickets}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <a href={ebUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline">
                        Open ↗
                      </a>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${pe.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {pe.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Assign new promoter */}
      {unassigned.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Assign Promoter</h2>
          <form action="/api/admin/assignments" method="POST" className="flex gap-3 items-end flex-wrap">
            <input type="hidden" name="event_id" value={event.id} />
            <div>
              <label className="block text-xs text-gray-500 mb-1">Promoter</label>
              <select name="promoter_id" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black">
                {unassigned.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.promo_code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Link Slug</label>
              <input
                type="text" name="link_slug"
                placeholder={suggestLinkSlug(unassigned[0]?.slug ?? 'slug', event.name)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black w-44"
              />
            </div>
            <button type="submit"
              className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
              Assign
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
