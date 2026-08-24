import Link from 'next/link';
import { db } from '@/lib/db';

export default async function EventsPage() {
  const events = await db.events.list();
  const allAssignments = await Promise.all(events.map(e => db.assignments.forEvent(e.id)));
  const ticketsPerEvent = allAssignments.map(a => a.reduce((sum, x) => sum + x.tickets_sold, 0));

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="label-meta mb-1">{events.length} Total</p>
          <h1 className="page-title">Events</h1>
        </div>
        <Link href="/admin/events/new" className="btn-primary mt-1">
          + Add Event
        </Link>
      </div>

      {/* ── Empty state ── */}
      {events.length === 0 && (
        <div className="dark-card px-6 py-16 text-center">
          <p className="text-sm" style={{ color: '#555' }}>No events yet.</p>
          <Link href="/admin/events/new" className="btn-primary mt-4 mx-auto">
            Create first event
          </Link>
        </div>
      )}

      {/* ── Event cards ── */}
      <div className="space-y-3">
        {events.map((event, i) => {
          const assignments  = allAssignments[i];
          const totalTickets = ticketsPerEvent[i];
          const dateStr = event.event_date
            ? new Date(event.event_date).toLocaleDateString('en-AU', {
                day: 'numeric', month: 'short', year: 'numeric',
                timeZone: 'Australia/Melbourne',
              })
            : null;

          return (
            <div key={event.id} className="dark-card p-5 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="font-bold text-base tracking-wide" style={{ color: '#F2F2EE' }}>
                      {event.name}
                    </h2>
                    <span className={event.is_active ? 'badge-active' : 'badge-inactive'}>
                      {event.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs mt-1.5" style={{ color: '#555' }}>
                    {[event.venue, event.city, event.state].filter(Boolean).join(' · ')}
                    {dateStr && <span> · {dateStr}</span>}
                  </p>
                </div>
                <Link href={`/admin/events/${event.slug}`} className="btn-secondary shrink-0">
                  Manage →
                </Link>
              </div>

              <div className="mt-4 pt-4 flex items-center gap-6" style={{ borderTop: '1px solid #1a1a1a' }}>
                <div>
                  <span className="metric-value" style={{ fontSize: '1.5rem' }}>{totalTickets}</span>
                  <span className="label-meta ml-2">Tickets Sold</span>
                </div>
                <div style={{ borderLeft: '1px solid #1a1a1a', paddingLeft: '1.5rem' }}>
                  <span className="font-bold text-xl" style={{ color: '#F2F2EE' }}>{assignments.length}</span>
                  <span className="label-meta ml-2">Promoters</span>
                </div>
                {event.eventbrite_event_id && (
                  <div className="ml-auto">
                    <span className="label-meta">EB ID: </span>
                    <span className="font-mono text-xs" style={{ color: '#555' }}>{event.eventbrite_event_id}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
