import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createEventPromoCode, ebFetchDebug } from '@/lib/eventbrite/api';

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
    const msg = err instanceof Error ? err.message : String(err);
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

  const results: { event: string; status: string }[] = [];

  for (const a of eligible) {
    const ebEventId = a.event.eventbrite_event_id!;
    try {
      await createEventPromoCode(ebEventId, promoter.promo_code);
      results.push({ event: a.event.name, status: 'created' });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // Code already exists on this event — that's fine
      if (message.toLowerCase().includes('already exists') || message.includes('409') || message.includes('duplicate')) {
        results.push({ event: a.event.name, status: 'already exists' });
      } else {
        results.push({ event: a.event.name, status: `error: ${message}` });
      }
    }
  }

  const allFailed = results.every(r => r.status.startsWith('error'));
  if (allFailed) {
    return NextResponse.json({ error: results[0].status.replace('error: ', '') }, { status: 500 });
  }

  return NextResponse.json({ success: true, results });
}
