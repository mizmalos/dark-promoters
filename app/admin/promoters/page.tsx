import Link from 'next/link';
import { db } from '@/lib/db';

export default async function PromotersPage() {
  const promoters = await db.promoters.list();
  const allAssignments = await Promise.all(promoters.map(p => db.assignments.forPromoter(p.id)));
  const ticketsByPromoter = new Map(
    promoters.map((p, i) => [
      p.id,
      allAssignments[i].reduce((sum, a) => sum + a.tickets_sold, 0),
    ])
  );

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="label-meta mb-1">{promoters.length} Total</p>
          <h1 className="page-title">Promoters</h1>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Link href="/admin/promoters/import" className="btn-secondary">
            Import CSV
          </Link>
          <Link href="/admin/promoters/new" className="btn-primary">
            + Add Promoter
          </Link>
        </div>
      </div>

      {/* ── Empty state ── */}
      {promoters.length === 0 && (
        <div className="dark-card px-6 py-16 text-center">
          <p className="text-sm" style={{ color: '#555' }}>No promoters yet.</p>
          <Link href="/admin/promoters/new" className="btn-primary mt-4 mx-auto">
            Add first promoter
          </Link>
        </div>
      )}

      {/* ── Mobile cards ── */}
      <div className="md:hidden space-y-3">
        {promoters.map(p => {
          const tickets = ticketsByPromoter.get(p.id) ?? 0;
          const eventCount = allAssignments[promoters.indexOf(p)]?.length ?? 0;
          return (
            <Link key={p.id} href={`/admin/promoters/${p.id}`} className="dark-card p-5 block transition-all hover:border-[#333]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                    style={{ background: 'rgba(183,255,0,0.07)', color: '#B7FF00', border: '1px solid rgba(183,255,0,0.15)' }}
                  >
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm" style={{ color: '#F2F2EE' }}>{p.name}</p>
                      {p.source === 'self_serve' && <SourceBadge />}
                    </div>
                    {p.instagram && <p className="text-xs" style={{ color: '#555' }}>{p.instagram}</p>}
                  </div>
                </div>
                <span className={p.is_active ? 'badge-active' : 'badge-inactive'}>
                  {p.is_active ? 'Active' : 'Off'}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <span className="font-mono text-xs font-bold" style={{ color: '#B7FF00' }}>{p.promo_code}</span>
                  <span className="label-meta ml-1.5">CODE</span>
                </div>
                <div style={{ borderLeft: '1px solid #1a1a1a', paddingLeft: '1rem' }}>
                  <span className="font-bold text-sm" style={{ color: '#F2F2EE' }}>{tickets}</span>
                  <span className="label-meta ml-1.5">Tickets</span>
                </div>
                <div style={{ borderLeft: '1px solid #1a1a1a', paddingLeft: '1rem' }}>
                  <span className="font-bold text-sm" style={{ color: '#F2F2EE' }}>{eventCount}</span>
                  <span className="label-meta ml-1.5">Events</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── Desktop table ── */}
      {promoters.length > 0 && (
        <div className="dark-card overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="dark-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Location</th>
                  <th>Instagram</th>
                  <th>Tickets</th>
                  <th>Events</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {promoters.map((p, i) => {
                  const tickets    = ticketsByPromoter.get(p.id) ?? 0;
                  const eventCount = allAssignments[i]?.length ?? 0;
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ background: 'rgba(183,255,0,0.07)', color: '#B7FF00' }}
                          >
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold" style={{ color: '#F2F2EE' }}>{p.name}</span>
                              {p.source === 'self_serve' && <SourceBadge />}
                            </div>
                            {p.email && <div className="text-xs" style={{ color: '#555' }}>{p.email}</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="font-mono text-xs font-bold" style={{ color: '#B7FF00' }}>{p.promo_code}</span>
                      </td>
                      <td style={{ color: '#777' }}>{[p.city, p.state].filter(Boolean).join(', ') || '—'}</td>
                      <td style={{ color: '#777' }}>{p.instagram ?? '—'}</td>
                      <td><span className="ticket-chip">{tickets}</span></td>
                      <td style={{ color: '#777' }}>{eventCount}</td>
                      <td>
                        <span className={p.is_active ? 'badge-active' : 'badge-inactive'}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <Link href={`/admin/promoters/${p.id}`} className="label-meta-2 transition-colors hover:text-[#F2F2EE]">
                          View →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SourceBadge() {
  return (
    <span
      className="label-meta shrink-0"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #2A2A2A', padding: '2px 6px', borderRadius: '4px' }}
    >
      Self-serve
    </span>
  );
}
