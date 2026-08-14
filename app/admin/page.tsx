import Link from 'next/link';
import { db } from '@/lib/db';

export default async function AdminDashboard() {
  const [promoters, events] = await Promise.all([
    db.promoters.list(),
    db.events.list(),
  ]);

  const allAssignments = (
    await Promise.all(events.map(e => db.assignments.forEvent(e.id)))
  ).flat();

  const totalValidTickets = allAssignments.reduce((sum, a) => sum + a.tickets_sold, 0);
  const activeEvents    = events.filter(e => e.is_active).length;
  const activePromoters = promoters.filter(p => p.is_active).length;

  const stats = [
    { label: 'Active Promoters',  value: activePromoters,       href: '/admin/promoters' },
    { label: 'Active Events',     value: activeEvents,           href: '/admin/events' },
    { label: 'Total Assignments', value: allAssignments.length,  href: '/admin/events' },
    { label: 'Valid Tickets Sold',value: totalValidTickets,      href: '/admin/sync' },
  ];

  const performers = allAssignments
    .map(a => ({ name: a.promoter.name, event: a.event.name, tickets: a.tickets_sold, slug: a.link_slug }))
    .sort((a, b) => b.tickets - a.tickets)
    .slice(0, 5);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of all DARK promoter activity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
        {stats.map(s => (
          <Link key={s.label} href={s.href}
            className="bg-white rounded-xl border border-gray-200 px-5 py-4 hover:shadow-sm transition-shadow">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{s.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{s.value}</p>
          </Link>
        ))}
      </div>

      {/* Top performers table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Top Performers</h2>
          <Link href="/admin/promoters" className="text-sm text-gray-500 hover:text-black">
            View all →
          </Link>
        </div>
        {performers.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">No data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Promoter</th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Event</th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Tickets</th>
                  <th className="hidden sm:table-cell px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Short Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {performers.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 md:px-6 py-3 font-medium text-gray-900 whitespace-nowrap">{p.name}</td>
                    <td className="px-4 md:px-6 py-3 text-gray-600 max-w-[140px] md:max-w-xs truncate">{p.event}</td>
                    <td className="px-4 md:px-6 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-black text-white">
                        {p.tickets}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-4 md:px-6 py-3 text-gray-400 text-xs font-mono">
                      /m/{p.slug}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/admin/promoters/new"
          className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
          + Add Promoter
        </Link>
        <Link href="/admin/events/new"
          className="bg-white border border-gray-200 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
          + Add Event
        </Link>
        <Link href="/admin/sync"
          className="bg-white border border-gray-200 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
          Sync Logs
        </Link>
      </div>
    </div>
  );
}
