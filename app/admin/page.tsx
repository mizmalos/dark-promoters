import Link from 'next/link';
import { db } from '@/lib/mock-db';
import { countValidTickets } from '@/lib/utils/tickets';

export default function AdminDashboard() {
  const promoters = db.promoters.list();
  const events    = db.events.list();
  const allAssignments = events.flatMap(e => db.assignments.forEvent(e.id));
  const allSales = allAssignments.flatMap(a => db.sales.forAssignment(a.id));
  const totalValidTickets = countValidTickets(allSales);
  const activeEvents   = events.filter(e => e.is_active).length;
  const activePromoters = promoters.filter(p => p.is_active).length;

  const stats = [
    { label: 'Active Promoters', value: activePromoters,    href: '/admin/promoters' },
    { label: 'Active Events',    value: activeEvents,        href: '/admin/events' },
    { label: 'Total Assignments',value: allAssignments.length, href: '/admin/events' },
    { label: 'Valid Tickets Sold', value: totalValidTickets, href: '/admin/sync' },
  ];

  // Top performers
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
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Top Performers</h2>
          <Link href="/admin/promoters" className="text-sm text-gray-500 hover:text-black">
            View all →
          </Link>
        </div>
        {performers.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">No data yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Promoter', 'Event', 'Valid Tickets', 'Short Link'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {performers.map((p, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-6 py-3 text-gray-600 truncate max-w-xs">{p.event}</td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-black text-white">
                      {p.tickets}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-400 text-xs font-mono">
                    tickets.dark.com/m/{p.slug}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick links */}
      <div className="mt-6 flex gap-3">
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
