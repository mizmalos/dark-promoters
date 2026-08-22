import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { db } from '@/lib/db';
import {
  countValidTickets,
  commissionForEvent,
  hasEarnedFreeTicket,
  usesUntilFreeTicket,
  FREE_TICKET_THRESHOLD,
} from '@/lib/utils/tickets';
import { ShareButton, CopyCodeButton } from '../../ShareButton';
import SignOutButton from '../SignOutButton';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://dark-promoters.vercel.app';

export default async function PortalEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/portal');

  const promoter = user.email ? await db.promoters.getByEmail(user.email) : null;
  if (!promoter || !promoter.is_active) redirect('/portal/dashboard');

  const assignment = (await db.assignments.forPromoter(promoter.id)).find(a => a.id === id);
  if (!assignment) notFound();

  const sales = await db.sales.forAssignment(assignment.id);
  const uses = countValidTickets(sales);
  const commission = commissionForEvent(uses);
  const unlocked = hasEarnedFreeTicket(uses);
  const remaining = usesUntilFreeTicket(uses);
  const progressPct = Math.min(100, (uses / FREE_TICKET_THRESHOLD) * 100);

  const shareUrl = `${BASE_URL}/m/${assignment.link_slug}`;
  const dateStr = assignment.event.event_date
    ? new Date(assignment.event.event_date).toLocaleDateString('en-AU', {
        day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Melbourne',
      })
    : null;

  return (
    <div className="min-h-screen" style={{ background: '#070707' }}>
      <header
        className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between"
        style={{ background: 'rgba(7,7,7,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #1a1a1a' }}
      >
        <Image src="/dark-logo.png" alt="DARK" width={56} height={10} priority />
        <div className="flex items-center gap-4">
          <span className="label-meta hidden sm:block">Promoter Portal</span>
          <SignOutButton />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 py-8 space-y-6">
        <Link href="/portal/dashboard" className="label-meta inline-flex items-center gap-1.5 transition-colors hover:text-[#F2F2EE]">
          ← Your Events
        </Link>

        {/* ── Event header ── */}
        <div>
          <h1 className="font-black text-2xl tracking-[0.02em]" style={{ color: '#F2F2EE' }}>
            {assignment.event.name}
          </h1>
          <p className="text-sm mt-1" style={{ color: '#555' }}>
            {[assignment.event.venue, assignment.event.city, dateStr].filter(Boolean).join(' · ')}
          </p>
        </div>

        {/* ── Uses + commission ── */}
        <div className="dark-card p-6">
          <p className="label-meta mb-4">This Event</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="metric-value" style={{ fontSize: '2.25rem' }}>{uses}</span>
              <p className="label-meta mt-1">Uses</p>
            </div>
            <div>
              <span className="metric-value-green" style={{ fontSize: '2.25rem' }}>${commission}</span>
              <p className="label-meta mt-1">Commission</p>
            </div>
          </div>

          {unlocked ? (
            <div className="mt-5 flex items-center justify-between gap-3">
              <span className="badge-active">Free ticket unlocked</span>
              <p className="label-meta text-right">Earning $5 per sale from here</p>
            </div>
          ) : (
            <div className="mt-5">
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1a1a1a' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${progressPct}%`, background: '#B7FF00' }}
                />
              </div>
              <p className="label-meta mt-2">
                {remaining} more sale{remaining !== 1 ? 's' : ''} to unlock your free ticket
              </p>
            </div>
          )}
        </div>

        {/* ── Share link ── */}
        <div className="dark-card p-6 space-y-4">
          <p className="label-meta-2">Your Share Link</p>
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2.5"
            style={{ background: '#111', border: '1px solid #1E1E1E' }}
          >
            <span className="font-mono text-xs flex-1 truncate" style={{ color: '#555' }}>{shareUrl}</span>
          </div>
          <ShareButton url={shareUrl} eventName={assignment.event.name} />
        </div>

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
      </div>
    </div>
  );
}
