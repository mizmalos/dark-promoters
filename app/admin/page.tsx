import Link from 'next/link';
import { db } from '@/lib/db';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'GOOD MORNING,';
  if (h < 17) return 'GOOD AFTERNOON,';
  return 'GOOD EVENING,';
}

export default async function AdminDashboard() {
  const [promoters, events] = await Promise.all([db.promoters.list(), db.events.list()]);

  const allAssignments = (
    await Promise.all(events.map(e => db.assignments.forEvent(e.id)))
  ).flat();

  const totalValidTickets = allAssignments.reduce((sum, a) => sum + a.tickets_sold, 0);
  const activeEvents      = events.filter(e => e.is_active).length;
  const activePromoters   = promoters.filter(p => p.is_active).length;

  const performers = allAssignments
    .map(a => ({ name: a.promoter.name, event: a.event.name, tickets: a.tickets_sold, promoterId: a.promoter_id }))
    .sort((a, b) => b.tickets - a.tickets)
    .slice(0, 5);

  const topPerformer = performers[0] ?? null;

  const upcomingEvents = events
    .filter(e => e.is_active && e.event_date)
    .sort((a, b) => new Date(a.event_date!).getTime() - new Date(b.event_date!).getTime())
    .slice(0, 2);

  const metrics = [
    { label: 'Active Promoters', value: activePromoters,    href: '/admin/promoters' },
    { label: 'Active Events',    value: activeEvents,       href: '/admin/events' },
    { label: 'Tickets Sold',     value: totalValidTickets,  href: '/admin/sync', green: true },
  ];

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div>
        <p className="label-meta mb-1">{getGreeting()}</p>
        <h1 className="font-black tracking-[0.12em] text-3xl md:text-4xl" style={{ color: '#F2F2EE' }}>
          {(process.env.NEXT_PUBLIC_ADMIN_NAME ?? 'DARK').toUpperCase()}.
        </h1>
        <p className="label-meta-2 mt-2">OVERVIEW</p>
      </div>

      {/* ── Metrics ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map(m => (
          <Link key={m.label} href={m.href} className="dark-card p-5 block transition-all duration-150 hover:border-[#333]">
            <p className="label-meta mb-3">{m.label}</p>
            <p className={m.green ? 'metric-value-green' : 'metric-value'}>{m.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ── Top Performer ── */}
        {topPerformer && (
          <div className="dark-card p-6">
            <p className="label-meta mb-5">Top Performer</p>
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shrink-0"
                style={{ background: 'rgba(183,255,0,0.08)', color: '#B7FF00', border: '1px solid rgba(183,255,0,0.2)' }}
              >
                {topPerformer.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-base truncate" style={{ color: '#F2F2EE' }}>
                  {topPerformer.name.toUpperCase()}
                </p>
                <p className="text-xs truncate" style={{ color: '#555' }}>{topPerformer.event}</p>
              </div>
            </div>
            <div className="mt-5 pt-5" style={{ borderTop: '1px solid #1a1a1a' }}>
              <span className="metric-value-green">{topPerformer.tickets}</span>
              <span className="label-meta ml-2">tickets</span>
            </div>
          </div>
        )}

        {/* ── Quick actions ── */}
        <div className="dark-card p-6 flex flex-col justify-between gap-4">
          <p className="label-meta">Quick Actions</p>
          <div className="space-y-2 flex-1 flex flex-col justify-center">
            <Link href="/admin/promoters/new" className="btn-primary justify-center text-center">
              + Add Promoter
            </Link>
            <Link href="/admin/events/new" className="btn-secondary justify-center text-center">
              + Add Event
            </Link>
            <Link href="/admin/sync" className="btn-secondary justify-center text-center">
              Sync Eventbrite
            </Link>
          </div>
        </div>
      </div>

      {/* ── Upcoming events ── */}
      {upcomingEvents.length > 0 && (
        <div className="dark-card overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1a1a1a' }}>
            <p className="label-meta-2">Upcoming Events</p>
            <Link href="/admin/events" className="label-meta transition-colors hover:text-[#F2F2EE]" style={{ color: '#555' }}>
              View all →
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: '#1a1a1a' }}>
            {upcomingEvents.map(event => {
              const dateStr = event.event_date
                ? new Date(event.event_date).toLocaleDateString('en-AU', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    timeZone: 'Australia/Melbourne',
                  })
                : null;
              return (
                <Link key={event.id} href={`/admin/events/${event.id}`}
                  className="flex items-center justify-between px-6 py-4 transition-all hover:bg-white/[0.02]"
                >
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#F2F2EE' }}>{event.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#555' }}>
                      {event.venue && `${event.venue} · `}{dateStr}
                    </p>
                  </div>
                  <span className="badge-active">Live</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Top performers table ── */}
      {performers.length > 0 && (
        <div className="dark-card overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1a1a1a' }}>
            <p className="label-meta-2">Performer Rankings</p>
            <Link href="/admin/promoters" className="label-meta transition-colors hover:text-[#F2F2EE]" style={{ color: '#555' }}>
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="dark-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Promoter</th>
                  <th>Event</th>
                  <th>Tickets</th>
                </tr>
              </thead>
              <tbody>
                {performers.map((p, i) => (
                  <tr key={i}>
                    <td className="w-10">
                      <span className="label-meta">{String(i + 1).padStart(2, '0')}</span>
                    </td>
                    <td className="font-semibold" style={{ color: '#F2F2EE' }}>
                      {p.name}
                    </td>
                    <td style={{ color: '#777' }}>{p.event}</td>
                    <td>
                      <span className="ticket-chip">{p.tickets}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
