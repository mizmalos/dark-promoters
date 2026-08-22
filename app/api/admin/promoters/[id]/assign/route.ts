import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { suggestLinkSlug } from '@/lib/utils/tickets';
import { uniqueAssignmentSlug } from '@/lib/utils/assign';

const CHUNK_SIZE = 25;

interface Skipped {
  event_id: string;
  event_name: string;
  reason: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: promoter_id } = await params;
  const body = await req.json() as { event_ids?: string[] };
  const { event_ids } = body;

  if (!Array.isArray(event_ids) || event_ids.length === 0) {
    return NextResponse.json({ error: 'event_ids must be a non-empty array.' }, { status: 400 });
  }

  const promoter = await db.promoters.get(promoter_id);
  if (!promoter) return NextResponse.json({ error: 'Promoter not found.' }, { status: 404 });

  const [allEvents, existing] = await Promise.all([
    db.events.list(),
    db.assignments.forPromoter(promoter_id),
  ]);
  const eventMap = new Map(allEvents.map(e => [e.id, e]));
  const alreadyAssigned = new Set(existing.map(a => a.event_id));

  const uniqueIds = Array.from(new Set(event_ids));
  const skipped: Skipped[] = [];
  let created = 0;

  for (let i = 0; i < uniqueIds.length; i += CHUNK_SIZE) {
    const chunk = uniqueIds.slice(i, i + CHUNK_SIZE);
    await Promise.all(chunk.map(async (event_id) => {
      const event = eventMap.get(event_id);
      if (!event) {
        skipped.push({ event_id, event_name: '(unknown)', reason: 'Event not found.' });
        return;
      }
      if (alreadyAssigned.has(event_id)) {
        skipped.push({ event_id, event_name: event.name, reason: 'Already assigned to this event.' });
        return;
      }
      try {
        const link_slug = await uniqueAssignmentSlug(suggestLinkSlug(promoter.slug, event.name));
        await db.assignments.create(promoter_id, event_id, link_slug);
        created++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[promoters/assign] create failed:', event_id, msg);
        const duplicate = msg.toLowerCase().includes('duplicate') || msg.includes('23505');
        skipped.push({
          event_id,
          event_name: event.name,
          reason: duplicate ? 'Already assigned to this event.' : msg,
        });
      }
    }));
  }

  if (created > 0) {
    revalidatePath(`/admin/promoters/${promoter_id}`);
    revalidatePath('/admin/promoters');
    for (const event_id of uniqueIds) revalidatePath(`/admin/events/${event_id}`);
  }

  return NextResponse.json({ created, skipped });
}
