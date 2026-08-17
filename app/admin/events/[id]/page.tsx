import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { countValidTickets, buildEventbriteUrl, suggestLinkSlug } from '@/lib/utils/tickets';

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await db.events.withPromoters(id);
  if (!event) notFound();

  const allPromoters = (await db.promoters.list()).filter(p => p.is_active);
  const assignedIds  = new Set(event.promoter_events.map(pe => pe.promoter_id));
  const unassigned   = allPromoters.filter(p => !assignedIds.has(p.id));

  const salesPerPe = await Promise.all(
    event.promoter_events.map(pe => db.sales.forAssignment(pe.id))
  );

  const dateStr = event.event_date
    ? new Date(event.event_date).toLocaleDateString('en-AU', {
        day: 'numeric', month: 'long', year: 'numeric',
        timeZone: 'Australia/Melbourne',
      })
    : null;

  const totalTickets = salesPerPe.reduce((sum, sales) => sum + countValidTickets(sales), 0);

  // Ranked list
  const ranked = event.promoter_events
    .map((pe, i) => ({ pe, tickets: countValidTickets(salesPerPe[i]) }))
    .sort((a, b) => b.tickets - a.tickets);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ── Back ── */}
      <Link href="/admin/events" className="label-meta inline-flex items-center gap-1.5 transition-colors hover:text-[#F2F2EE]">
        ← Events
      </Link>

      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="page-title">{event.name}</h1>
          <span className={event.is_active ? 'badge-active' : 'badge-inactive'}>
            {event.is_active ? 'Active' : 'Inactive'}
          </span>
          {event.eventbrite_url && (
            <a
              href={event.eventbrite_url}
              target="_blank"
              rel="noopener noreferrer"
              className="label-meta transition-colors hover:text-[#F2F2EE]"
              style={{ color: '#555' }}
            >
              Eventbrite ↗
            </a>
          )}
        </div>
        <p className="text-sm mt-2" style={{ color: '#555' }}>
          {[event.venue, event.city, event.state].filter(Boolean).join(' · ')}
          {dateStr && <span> · {dateStr}</span>}
        </p>
      </div>

      {/* ── Metrics ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: 'Tickets Sold', value: totalTickets, green: true },
          { label: 'Promoters',    value: event.promoter_events.length },
          { label: 'Eventbrite ID', value: event.eventbrite_event_id ?? '—', mono: true },
        ].map(m => (
          <div key={m.label} className="dark-card p-5">
            <p className="label-meta mb-3">{m.label}</p>
            <p
              className={m.green ? 'metric-value-green' : 'metric-value'}
              style={m.mono ? { fontSize: '1rem', fontFamily: 'monospace', color: '#777' } : {}}
            >
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Promoter performance ── */}
      <div className="dark-card overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1a1a1a' }}>
          <p className="label-meta-2">Promoter Performance</p>
          <span className="label-meta">{event.promoter_events.length} assigned</span>
        </div>

        {event.promoter_events.length === 0 ? (
          <p className="px-6 py-10 text-sm text-center" style={{ color: '#555' }}>
            No promoters assigned yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="dark-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Promoter</th>
                  <th>Code</th>
                  <th className="hidden sm:table-cell">Slug</th>
                  <th>Tickets</th>
                  <th className="hidden md:table-cell">Eventbrite</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map(({ pe, tickets }, i) => {
                  const ebUrl = buildEventbriteUrl(event.eventbrite_url, pe.promoter.promo_code);
                  return (
                    <tr key={pe.id}>
                      <td className="w-10">
                        <span className="label-meta">{String(i + 1).padStart(2, '0')}</span>
                      </td>
                      <td>
                        <Link
                          href={`/admin/promoters/${pe.promoter_id}`}
                          className="font-semibold transition-colors hover:text-[#B7FF00]"
                          style={{ color: '#F2F2EE' }}
                        >
                          {pe.promoter.name}
                        </Link>
                        {pe.promoter.city && (
                          <div className="text-xs mt-0.5" style={{ color: '#555' }}>{pe.promoter.city}</div>
                        )}
                      </td>
                      <td>
                        <span className="font-mono text-xs font-semibold" style={{ color: '#B7FF00' }}>
                          {pe.promoter.promo_code}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell">
                        <span className="font-mono text-xs" style={{ color: '#555' }}>/m/{pe.link_slug}</span>
                      </td>
                      <td>
                        <span className="ticket-chip">{tickets}</span>
                      </td>
                      <td className="hidden md:table-cell">
                        <a href={ebUrl} target="_blank" rel="noopener noreferrer"
                          className="label-meta-2 transition-colors hover:text-[#F2F2EE]">
                          Open ↗
                        </a>
                      </td>
                      <td>
                        <span className={pe.is_active ? 'badge-active' : 'badge-inactive'}>
                          {pe.is_active ? 'Active' : 'Off'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Assign promoter ── */}
      {unassigned.length > 0 && (
        <div className="dark-card p-6">
          <p className="label-meta-2 mb-5">Assign Promoter</p>
          <form action="/api/admin/assignments" method="POST"
            className="flex flex-col sm:flex-row gap-3 items-start sm:items-end flex-wrap"
          >
            <input type="hidden" name="event_id" value={event.id} />
            <div className="w-full sm:w-auto flex-1 min-w-[180px]">
              <label className="label-meta block mb-2">Promoter</label>
              <select name="promoter_id" className="dark-select">
                {unassigned.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.promo_code})</option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-44">
              <label className="label-meta block mb-2">Link Slug</label>
              <input
                type="text"
                name="link_slug"
                placeholder={suggestLinkSlug(unassigned[0]?.slug ?? 'slug', event.name)}
                className="dark-input"
              />
            </div>
            <button type="submit" className="btn-primary">
              Assign
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
