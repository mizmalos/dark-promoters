import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { countValidTickets, buildEventbriteUrl } from '@/lib/utils/tickets';
import { PushEventbriteButton, CopyLinkButton } from './EventbriteActions';
import AssignEventsPanel from './AssignEventsPanel';
import { InviteButton } from './InviteButton';
import { DeleteButton } from './DeleteButton';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://dark-promoters.vercel.app';

export default async function PromoterDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ auth_warning?: string }>;
}) {
  const { slug } = await params;
  const { auth_warning } = await searchParams;
  const promoter = await db.promoters.getBySlug(slug);
  if (!promoter) notFound();

  const [assignments, allEvents] = await Promise.all([
    db.assignments.forPromoter(promoter.id),
    db.events.list(),
  ]);
  const salesPerAssignment = await Promise.all(assignments.map(a => db.sales.forAssignment(a.id)));
  const totalTickets = salesPerAssignment.reduce((sum, sales) => sum + countValidTickets(sales), 0);

  const assignedEventIds = new Set(assignments.map(a => a.event_id));
  const unassignedEvents = allEvents.filter(e => e.is_active && !assignedEventIds.has(e.id));

  return (
    <div className="max-w-3xl space-y-6">
      {/* ── Back ── */}
      <Link href="/admin/promoters" className="label-meta inline-flex items-center gap-1.5 transition-colors hover:text-[#F2F2EE]">
        ← Promoters
      </Link>

      {/* ── Portal provisioning warning ── */}
      {auth_warning === '1' && (
        <div className="rounded-lg p-4 text-sm" style={{ background: 'rgba(255,68,68,0.06)', border: '1px solid rgba(255,68,68,0.2)', color: '#FF4444' }}>
          {promoter.name} was created, but their portal account couldn&apos;t be provisioned automatically. Click &quot;Enable Portal Access&quot; below to retry.
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-start gap-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center font-black text-xl shrink-0"
          style={{ background: 'rgba(183,255,0,0.08)', color: '#B7FF00', border: '1px solid rgba(183,255,0,0.2)' }}
        >
          {promoter.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="page-title">{promoter.name.toUpperCase()}</h1>
            <span className={promoter.is_active ? 'badge-active' : 'badge-inactive'}>
              {promoter.is_active ? 'Active' : 'Inactive'}
            </span>
            {promoter.source === 'self_serve' && (
              <span
                className="label-meta"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #2A2A2A', padding: '3px 8px', borderRadius: '4px' }}
              >
                Signed up via public link
              </span>
            )}
          </div>
          {promoter.instagram && (
            <p className="text-sm mt-1" style={{ color: '#555' }}>{promoter.instagram}</p>
          )}
        </div>
      </div>

      {/* ── Summary metrics ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="dark-card p-4">
          <p className="label-meta mb-2">Tickets Sold</p>
          <p className="metric-value-green" style={{ fontSize: '1.75rem' }}>{totalTickets}</p>
        </div>
        <div className="dark-card p-4">
          <p className="label-meta mb-2">Events</p>
          <p className="metric-value" style={{ fontSize: '1.75rem' }}>{assignments.length}</p>
        </div>
        <div className="dark-card p-4">
          <p className="label-meta mb-2">Revenue Est.</p>
          <p className="metric-value" style={{ fontSize: '1.75rem' }}>
            <span className="text-base mr-0.5" style={{ color: '#555' }}>$</span>
            {(totalTickets * 5).toLocaleString()}
          </p>
        </div>
      </div>

      {/* ── Promo code card ── */}
      <div className="dark-card p-6" style={{ border: '1px solid rgba(183,255,0,0.12)' }}>
        <p className="label-meta mb-4">Promo Code</p>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-black tracking-[0.15em] text-2xl" style={{ color: '#B7FF00' }}>
              {promoter.promo_code}
            </p>
            <p className="label-meta mt-1">$5 AUD discount · auto-applied at checkout</p>
          </div>
          <PushEventbriteButton promoterId={promoter.id} />
        </div>
      </div>

      {/* ── Details ── */}
      <div className="dark-card p-6">
        <div className="flex items-center justify-between mb-5 gap-3">
          <p className="label-meta-2">Details</p>
          <div className="flex items-center gap-2">
            {promoter.email && <InviteButton promoterId={promoter.id} />}
            <Link href={`/admin/promoters/${promoter.slug}/edit`} className="btn-secondary" style={{ padding: '6px 14px' }}>Edit</Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <Info label="Email"     value={promoter.email} />
          <Info label="Phone"     value={promoter.phone} />
          <Info label="Instagram" value={promoter.instagram} />
          <Info label="City"      value={promoter.city} />
          <Info label="State"     value={promoter.state} />
          <Info label="Slug"      value={promoter.slug} mono />
        </div>
        {promoter.notes && (
          <div className="mt-5 pt-5" style={{ borderTop: '1px solid #1a1a1a' }}>
            <p className="label-meta mb-2">Notes</p>
            <p className="text-sm" style={{ color: '#777' }}>{promoter.notes}</p>
          </div>
        )}
      </div>

      {/* ── Shareable links ── */}
      {assignments.length > 0 && (
        <div className="dark-card p-6">
          <p className="label-meta-2 mb-1">Shareable Links</p>
          <p className="label-meta mb-5">Send these to {promoter.name.split(' ')[0]}. Clicking auto-applies their $5 discount.</p>
          <div className="space-y-3">
            {assignments.map(a => (
              <div key={a.id}>
                <p className="label-meta mb-2">{a.event.name}</p>
                <CopyLinkButton
                  url={`${BASE_URL}/m/${a.link_slug}`}
                  label={`${BASE_URL}/m/${a.link_slug}`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Event assignments ── */}
      <div className="dark-card overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1a1a1a' }}>
          <p className="label-meta-2">Event Assignments</p>
          <span className="label-meta">{assignments.length} event{assignments.length !== 1 ? 's' : ''}</span>
        </div>

        {assignments.length === 0 ? (
          <p className="px-6 py-10 text-sm text-center" style={{ color: '#555' }}>Not assigned to any events yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="dark-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Tickets</th>
                  <th className="hidden sm:table-cell">Link</th>
                  <th className="hidden md:table-cell">Eventbrite</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a, i) => {
                  const tickets = countValidTickets(salesPerAssignment[i]);
                  const ebUrl   = buildEventbriteUrl(a.event.eventbrite_url, promoter.promo_code);
                  return (
                    <tr key={a.id}>
                      <td>
                        <div className="font-semibold" style={{ color: '#F2F2EE' }}>{a.event.name}</div>
                        {(a.event.city || a.event.state) && (
                          <div className="text-xs mt-0.5" style={{ color: '#555' }}>
                            {[a.event.city, a.event.state].filter(Boolean).join(', ')}
                          </div>
                        )}
                      </td>
                      <td><span className="ticket-chip">{tickets}</span></td>
                      <td className="hidden sm:table-cell">
                        <span className="font-mono text-xs" style={{ color: '#555' }}>/m/{a.link_slug}</span>
                      </td>
                      <td className="hidden md:table-cell">
                        <a href={ebUrl} target="_blank" rel="noopener noreferrer"
                          className="label-meta-2 transition-colors hover:text-[#F2F2EE]">
                          Open ↗
                        </a>
                      </td>
                      <td>
                        <span className={a.is_active ? 'badge-active' : 'badge-inactive'}>
                          {a.is_active ? 'Active' : 'Off'}
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

      {/* ── Assign to more events ── */}
      {unassignedEvents.length > 0 && (
        <AssignEventsPanel promoterId={promoter.id} unassignedEvents={unassignedEvents} />
      )}

      {/* ── Danger zone ── */}
      <div className="dark-card p-6" style={{ border: '1px solid rgba(255,68,68,0.15)' }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="label-meta-2" style={{ color: '#FF4444' }}>Danger Zone</p>
            <p className="text-xs mt-1" style={{ color: '#555' }}>
              Permanently delete this promoter and all their data. This cannot be undone.
            </p>
          </div>
          <DeleteButton
            promoterId={promoter.id}
            promoterName={promoter.name}
            eventCount={assignments.length}
            ticketCount={totalTickets}
          />
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div>
      <p className="label-meta mb-1">{label}</p>
      <p className={`text-sm ${mono ? 'font-mono' : ''}`} style={{ color: value ? '#F2F2EE' : '#555' }}>
        {value ?? '—'}
      </p>
    </div>
  );
}
