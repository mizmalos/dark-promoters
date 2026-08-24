import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureEventPromoCode, ebFetchDebug, getOrganizationId, EventbriteApiError } from '@/lib/eventbrite/api';
import { getErrorMessage } from '@/lib/utils/errors';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Token sanity check — log which Eventbrite account the token belongs to
  try {
    const me = await ebFetchDebug('/users/me/');
    console.log('[Eventbrite] Token is valid. Authenticated as:', JSON.stringify(me));
  } catch (err) {
    const msg = getErrorMessage(err);
    console.error('[Eventbrite] Token check failed:', msg);
    return NextResponse.json({ error: `Eventbrite token invalid: ${msg}` }, { status: 401 });
  }

  const promoter = await db.promoters.get(id);
  if (!promoter) return NextResponse.json({ error: 'Promoter not found.' }, { status: 404 });

  // Get all active assignments for this promoter that have an Eventbrite event ID
  const assignments = await db.assignments.forPromoter(id);
  const eligible = assignments.filter(
    a => a.is_active && a.event.is_active && a.event.eventbrite_event_id
  );

  if (eligible.length === 0) {
    return NextResponse.json({
      error: 'No active events with an Eventbrite ID assigned to this promoter. Assign them to an event first.',
    }, { status: 400 });
  }

  const orgId = await getOrganizationId();
  const results: { event: string; status: string }[] = [];

  for (const a of eligible) {
    try {
      const outcome = await ensureEventPromoCode(orgId, promoter.promo_code, a.event.eventbrite_event_id!);
      results.push({ event: a.event.name, status: outcome });
    } catch (err) {
      const message = getErrorMessage(err);
      const isAuthFailure =
        (err instanceof EventbriteApiError && err.status === 401) ||
        message.toLowerCase().includes('csrf') ||
        message.toLowerCase().includes('session');
      if (isAuthFailure) {
        results.push({ event: a.event.name, status: 'session_expired' });
      } else {
        results.push({ event: a.event.name, status: `error: ${message}` });
      }
    }
  }

  const sessionExpired = results.some(r => r.status === 'session_expired');
  if (sessionExpired) {
    return NextResponse.json({ error: 'SESSION_EXPIRED' }, { status: 401 });
  }

  const allFailed = results.every(r => r.status.startsWith('error'));
  if (allFailed) {
    return NextResponse.json({ error: results[0].status.replace('error: ', '') }, { status: 500 });
  }

  return NextResponse.json({ success: true, results });
}
