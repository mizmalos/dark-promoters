import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { db } from '@/lib/db';
import { countValidTickets } from '@/lib/utils/tickets';
import { ShareButton, CopyCodeButton } from '../ShareButton';
import SignOutButton from './SignOutButton';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://dark-promoters.vercel.app';

export default async function PortalDashboardPage() {
  // Validate session server-side
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/portal');

  // Look up promoter by auth email
  const promoter = user.email
    ? await db.promoters.getByEmail(user.email)
    : null;

  // Signed in but not a registered promoter
  if (!promoter || !promoter.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#070707' }}>
        <div className="text-center max-w-sm">
          <Image src="/dark-logo.png" alt="DARK" width={96} height={17} className="mx-auto mb-8" />
          <p className="font-semibold mb-2" style={{ color: '#F2F2EE' }}>Not registered</p>
          <p className="text-sm mb-6" style={{ color: '#555' }}>
            {user.email} isn&apos;t linked to an active promoter account. Contact DARK to get set up.
          </p>
          <SignOutButton />
        </div>
      </div>
    );
  }

  const assignments = (await db.assignments.forPromoter(promoter.id))
    .filter(a => a.is_active && a.event.is_active);

  const salesPerAssignment = await Promise.all(
    assignments.map(a => db.sales.forAssignment(a.id)),
  );
  const totalTickets = salesPerAssignment.reduce(
    (sum, sales) => sum + countValidTickets(sales),
    0,
  );

  return (
    <div className="min-h-screen" style={{ background: '#070707' }}>
      {/* ── Top bar ── */}
      <header
        className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between"
        style={{
          background: 'rgba(7,7,7,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #1a1a1a',
        }}
      >
        <Image src="/dark-logo.png" alt="DARK" width={56} height={10} priority />
        <div className="flex items-center gap-4">
          <span className="label-meta hidden sm:block">Promoter Portal</span>
          <SignOutButton />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 py-8 space-y-6">
        {/* ── Welcome ── */}
        <div>
          <p className="label-meta mb-0.5">Welcome back,</p>
          <h1 className="font-black text-3xl tracking-[0.05em]" style={{ color: '#F2F2EE' }}>
            {promoter.name.split(' ')[0].toUpperCase()}.
          </h1>
        </div>

        {/* ── Performance ── */}
        <div className="dark-card p-6">
          <p className="label-meta mb-4">Your Performance</p>
          <div className="flex items-end gap-4">
            <div>
              <span className="metric-value-green" style={{ fontSize: '3rem' }}>{totalTickets}</span>
            </div>
            <div className="mb-1">
              <p className="font-semibold text-sm" style={{ color: '#F2F2EE' }}>Tickets Sold</p>
              <p className="label-meta">
                {assignments.length} active event{assignments.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* ── Events ── */}
        {assignments.length > 0 && (
          <div className="space-y-3">
            <p className="label-meta-2">Your Events</p>
            {assignments.map((a, i) => {
              const tickets = countValidTickets(salesPerAssignment[i]);
              const shareUrl = `${BASE_URL}/m/${a.link_slug}`;
              const dateStr = a.event.event_date
                ? new Date(a.event.event_date).toLocaleDateString('en-AU', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    timeZone: 'Australia/Melbourne',
                  })
                : null;

              return (
                <div key={a.id} className="dark-card p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold" style={{ color: '#F2F2EE' }}>{a.event.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#555' }}>
                        {[a.event.venue, dateStr].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-black text-2xl" style={{ color: '#B7FF00' }}>{tickets}</span>
                      <p className="label-meta">tickets</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div
                      className="flex items-center gap-2 rounded-lg px-3 py-2.5"
                      style={{ background: '#111', border: '1px solid #1E1E1E' }}
                    >
                      <span className="font-mono text-xs flex-1 truncate" style={{ color: '#555' }}>
                        {shareUrl}
                      </span>
                    </div>
                    <ShareButton url={shareUrl} eventName={a.event.name} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {assignments.length === 0 && (
          <div className="dark-card px-6 py-12 text-center">
            <p className="text-sm" style={{ color: '#555' }}>No active events assigned yet.</p>
          </div>
        )}

        {/* ── Promo code ── */}
        <div className="dark-card p-6" style={{ border: '1px solid rgba(183,255,0,0.12)' }}>
          <p className="label-meta mb-5">Your Promo Code</p>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-black tracking-[0.18em] text-2xl" style={{ color: '#B7FF00' }}>
                {promoter.promo_code}
              </p>
              <p className="label-meta mt-1">$5 OFF · auto-applied at checkout</p>
            </div>
            <CopyCodeButton code={promoter.promo_code} />
          </div>
        </div>

        <p className="label-meta text-center pb-4">
          Share your link — the $5 discount applies automatically at checkout.
        </p>
      </div>
    </div>
  );
}
