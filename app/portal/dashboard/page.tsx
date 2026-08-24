import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { db } from '@/lib/db';
import { countValidTickets, commissionForEvent, hasEarnedFreeTicket } from '@/lib/utils/tickets';
import { CopyCodeButton } from '../ShareButton';
import SignOutButton from './SignOutButton';

export default async function PortalDashboardPage() {
  // Validate session server-side. middleware.ts already gates this route, but
  // check again defensively — and if the check itself throws (stale cookie,
  // transient Supabase error), treat it as unauthenticated rather than
  // erroring the whole page.
  const supabase = await createSupabaseServerClient();
  let user = null;
  try {
    user = (await supabase.auth.getUser()).data.user;
  } catch {}
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

  // First-ever dashboard view — show the welcome block once, then never again.
  const isFirstVisit = !promoter.welcomed_at;
  if (isFirstVisit) {
    await db.promoters.update(promoter.id, { welcomed_at: new Date().toISOString() });
  }

  const assignments = (await db.assignments.forPromoter(promoter.id))
    .filter(a => a.is_active && a.event.is_active);

  const salesPerAssignment = await Promise.all(
    assignments.map(a => db.sales.forAssignment(a.id)),
  );
  const usesPerAssignment = salesPerAssignment.map(countValidTickets);
  const commissionPerAssignment = usesPerAssignment.map(u => commissionForEvent(u));

  const totalUses = usesPerAssignment.reduce((sum, u) => sum + u, 0);
  const totalCommission = commissionPerAssignment.reduce((sum, c) => sum + c, 0);

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
        {isFirstVisit ? (
          <div className="dark-card p-6 space-y-5" style={{ border: '1px solid rgba(183,255,0,0.12)' }}>
            <div>
              <p className="label-meta mb-0.5">Welcome,</p>
              <h1 className="font-black text-3xl" style={{ color: '#F2F2EE' }}>
                {promoter.name.split(' ')[0]}
              </h1>
              <p className="text-sm mt-2" style={{ color: '#555' }}>
                You&apos;re in. Jump into the DARK community while you&apos;re here:
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="https://www.instagram.com/channel/AbYUbU04iILV7rdp/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary justify-center flex-1"
              >
                Join Broadcast Channel
              </a>
              <a
                href="https://ig.me/j/AbaD5H8-Mpok1dOy/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary justify-center flex-1"
              >
                Join Promoter Group Chat
              </a>
            </div>
          </div>
        ) : (
          <div>
            <p className="label-meta mb-0.5">Welcome back,</p>
            <h1 className="font-black text-3xl" style={{ color: '#F2F2EE' }}>
              {promoter.name.split(' ')[0].toUpperCase()}
            </h1>
          </div>
        )}

        {/* ── Performance ── */}
        <div className="dark-card p-6">
          <p className="label-meta mb-4">Your Performance</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="metric-value" style={{ fontSize: '2.25rem' }}>{totalUses}</span>
              <p className="label-meta mt-1">Total Uses</p>
            </div>
            <div>
              <span className="metric-value-green" style={{ fontSize: '2.25rem' }}>${totalCommission}</span>
              <p className="label-meta mt-1">Commission Earned</p>
            </div>
          </div>
          <p className="label-meta mt-5">
            {assignments.length} active event{assignments.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* ── Events ── */}
        {assignments.length > 0 && (
          <div className="space-y-3">
            <p className="label-meta-2">Your Events</p>
            {assignments.map((a, i) => {
              const uses = usesPerAssignment[i];
              const dateStr = a.event.event_date
                ? new Date(a.event.event_date).toLocaleDateString('en-AU', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    timeZone: 'Australia/Melbourne',
                  })
                : null;

              return (
                <Link
                  key={a.id}
                  href={`/portal/dashboard/${a.link_slug}`}
                  className="dark-card p-5 flex items-center justify-between gap-4 block transition-all hover:border-[#333]"
                >
                  <div className="min-w-0">
                    <p className="font-bold truncate" style={{ color: '#F2F2EE' }}>{a.event.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#555' }}>
                      {[a.event.venue, dateStr].filter(Boolean).join(' · ')}
                    </p>
                    {hasEarnedFreeTicket(uses) && (
                      <span className="badge-active mt-2 inline-flex">Free ticket unlocked</span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-black text-2xl" style={{ color: '#B7FF00' }}>{uses}</span>
                    <p className="label-meta">uses</p>
                  </div>
                </Link>
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
