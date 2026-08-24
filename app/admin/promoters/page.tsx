import Link from 'next/link';
import { db } from '@/lib/db';
import { SORT_OPTIONS, type SortValue } from './sortOptions';

const DEFAULT_SORT: SortValue = 'name-asc';

type SortColumn = 'name' | 'code' | 'uses';

function nextSort(current: SortValue, column: SortColumn): SortValue {
  switch (column) {
    case 'name': return current === 'name-asc' ? 'name-desc' : 'name-asc';
    case 'code': return current === 'code-asc' ? 'code-desc' : 'code-asc';
    case 'uses': return current === 'uses-desc' ? 'uses-asc' : 'uses-desc';
  }
}

function SortableHeader({ label, column, sort }: { label: string; column: SortColumn; sort: SortValue }) {
  const active = sort.startsWith(`${column}-`);
  const asc = sort.endsWith('-asc');
  return (
    <th>
      <Link
        href={`/admin/promoters?sort=${nextSort(sort, column)}`}
        className="inline-flex items-center gap-1 transition-colors hover:text-[#F2F2EE]"
      >
        {label}
        {active && <span style={{ color: '#B7FF00' }}>{asc ? '↑' : '↓'}</span>}
      </Link>
    </th>
  );
}

function SortChip({ label, column, sort }: { label: string; column: SortColumn; sort: SortValue }) {
  const active = sort.startsWith(`${column}-`);
  const asc = sort.endsWith('-asc');
  return (
    <Link
      href={`/admin/promoters?sort=${nextSort(sort, column)}`}
      className="label-meta inline-flex items-center gap-1"
      style={active ? { color: '#B7FF00' } : undefined}
    >
      {label}
      {active && <span>{asc ? '↑' : '↓'}</span>}
    </Link>
  );
}

export default async function PromotersPage({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const { sort: sortParam } = await searchParams;
  const sort: SortValue = SORT_OPTIONS.some(o => o.value === sortParam) ? (sortParam as SortValue) : DEFAULT_SORT;

  const promoters = await db.promoters.list();
  const allAssignments = await Promise.all(promoters.map(p => db.assignments.forPromoter(p.id)));
  const ticketsByPromoter = new Map(
    promoters.map((p, i) => [
      p.id,
      allAssignments[i].reduce((sum, a) => sum + a.tickets_sold, 0),
    ])
  );
  const eventCountByPromoter = new Map(promoters.map((p, i) => [p.id, allAssignments[i].length]));

  const sorted = [...promoters].sort((a, b) => {
    switch (sort) {
      case 'name-desc': return b.name.localeCompare(a.name);
      case 'code-asc':  return a.promo_code.localeCompare(b.promo_code);
      case 'code-desc': return b.promo_code.localeCompare(a.promo_code);
      case 'uses-asc':  return (ticketsByPromoter.get(a.id) ?? 0) - (ticketsByPromoter.get(b.id) ?? 0);
      case 'uses-desc': return (ticketsByPromoter.get(b.id) ?? 0) - (ticketsByPromoter.get(a.id) ?? 0);
      case 'name-asc':
      default:          return a.name.localeCompare(b.name);
    }
  });

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="label-meta mb-1">{promoters.length} Total</p>
          <h1 className="page-title">Promoters</h1>
        </div>
        <div className="flex items-center gap-2 sm:mt-1">
          <Link href="/admin/promoters/import" className="btn-secondary flex-1 sm:flex-none justify-center">
            Import CSV
          </Link>
          <Link href="/admin/promoters/new" className="btn-primary flex-1 sm:flex-none justify-center">
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

      {/* ── Mobile sort ── */}
      {promoters.length > 0 && (
        <div className="md:hidden flex items-center gap-4 px-1">
          <span className="label-meta" style={{ color: '#555' }}>Sort:</span>
          <SortChip label="Name" column="name" sort={sort} />
          <SortChip label="Code" column="code" sort={sort} />
          <SortChip label="Tickets" column="uses" sort={sort} />
        </div>
      )}

      {/* ── Mobile cards ── */}
      <div className="md:hidden space-y-3">
        {sorted.map(p => {
          const tickets = ticketsByPromoter.get(p.id) ?? 0;
          const eventCount = eventCountByPromoter.get(p.id) ?? 0;
          return (
            <Link key={p.id} href={`/admin/promoters/${p.slug}`} className="dark-card p-5 block transition-all">
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
                  <SortableHeader label="Name" column="name" sort={sort} />
                  <SortableHeader label="Code" column="code" sort={sort} />
                  <th>Location</th>
                  <th>Instagram</th>
                  <SortableHeader label="Tickets" column="uses" sort={sort} />
                  <th>Events</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(p => {
                  const tickets    = ticketsByPromoter.get(p.id) ?? 0;
                  const eventCount = eventCountByPromoter.get(p.id) ?? 0;
                  return (
                    <tr key={p.id}>
                      <td>
                        <Link
                          href={`/admin/promoters/${p.slug}`}
                          className="row-link-cover"
                          aria-label={`View ${p.name}`}
                        />
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
