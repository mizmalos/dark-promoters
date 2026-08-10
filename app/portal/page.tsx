// Promoter portal — in the MVP this uses a query param ?promoter=<slug>
// for easy testing. In Phase 3 this will use Supabase Auth session.

import { db } from '@/lib/mock-db';
import { countValidTickets, buildEventbriteUrl } from '@/lib/utils/tickets';
import Link from 'next/link';

interface Props {
  searchParams: { promoter?: string };
}

export default function PortalPage({ searchParams }: Props) {
  // MVP: ?promoter=claire — in production replaced by auth session lookup
  const slug = searchParams.promoter;

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-black tracking-widest mb-4">DARK</div>
          <p className="text-gray-500 text-sm mb-6">Promoter Portal</p>
          <p className="text-xs text-gray-400">
            MVP preview — add <code className="bg-gray-100 px-1 rounded">?promoter=claire</code> to the URL
          </p>
          <div className="mt-4 flex gap-2 justify-center">
            {db.promoters.list().map(p => (
              <Link key={p.id} href={`/portal?promoter=${p.slug}`}
                className="text-sm px-3 py-1.5 rounded-lg bg-black text-white hover:bg-gray-800 transition-colors">
                {p.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const promoter = db.promoters.getBySlug(slug);

  if (!promoter || !promoter.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Promoter not found or inactive.</p>
          <Link href="/portal" className="text-sm text-black underline mt-2 inline-block">Back</Link>
        </div>
      </div>
    );
  }

  const assignments = db.assignments.forPromoter(promoter.id)
    .filter(a => a.is_active && a.event.is_active);

  const totalTickets = assignments.reduce((sum, a) => {
    return sum + countValidTickets(db.sales.forAssignment(a.id));
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black text-white px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <span className="text-xl font-black tracking-widest">DARK</span>
          <span className="text-sm text-white/60">Promoter Portal</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Hey, {promoter.name.split(' ')[0]} 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Your promo code: <span className="font-mono font-bold text-gray-900">{promoter.promo_code}</span></p>
        </div>

        {/* Summary card */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Tickets Sold</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{totalTickets}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Active Events</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{assignments.length}</p>
          </div>
        </div>

        {/* Per-event table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Your Events</h2>
          </div>

          {assignments.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-400 text-sm">No active events assigned yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Event', 'Tickets Sold', 'Your Sharing Link'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assignments.map(a => {
                  const sales   = db.sales.forAssignment(a.id);
                  const tickets = countValidTickets(sales);
                  const shareLink = `tickets.dark.com/m/${a.link_slug}`;
                  const ebUrl = buildEventbriteUrl(a.event.eventbrite_url, promoter.promo_code);

                  const eventDate = a.event.event_date
                    ? new Date(a.event.event_date).toLocaleDateString('en-AU', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        timeZone: 'Australia/Melbourne',
                      })
                    : null;

                  return (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{a.event.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {a.event.venue && `${a.event.venue} · `}{eventDate}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold bg-black text-white">
                          {tickets}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">
                            {shareLink}
                          </span>
                          <a href={ebUrl} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-gray-400 hover:text-black transition-colors">
                            Test ↗
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          Share your link and your $5 discount code <strong>{promoter.promo_code}</strong> is applied automatically at checkout.
        </p>
      </div>
    </div>
  );
}
