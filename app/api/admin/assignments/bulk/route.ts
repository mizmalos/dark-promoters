import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { suggestLinkSlug } from '@/lib/utils/tickets';
import { uniqueAssignmentSlug } from '@/lib/utils/assign';

const CHUNK_SIZE = 25;

interface Skipped {
  promoter_id: string;
  promoter_name: string;
  reason: string;
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { event_id?: string; promoter_ids?: string[] };
  const { event_id, promoter_ids } = body;

  if (!event_id) return NextResponse.json({ error: 'event_id is required.' }, { status: 400 });
  if (!Array.isArray(promoter_ids) || promoter_ids.length === 0) {
    return NextResponse.json({ error: 'promoter_ids must be a non-empty array.' }, { status: 400 });
  }

  const event = await db.events.get(event_id);
  if (!event) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });

  const [allPromoters, existing] = await Promise.all([
    db.promoters.list(),
    db.assignments.forEvent(event_id),
  ]);
  const promoterMap = new Map(allPromoters.map(p => [p.id, p]));
  const alreadyAssigned = new Set(existing.map(a => a.promoter_id));

  const uniqueIds = Array.from(new Set(promoter_ids));
  const skipped: Skipped[] = [];
  let created = 0;

  for (let i = 0; i < uniqueIds.length; i += CHUNK_SIZE) {
    const chunk = uniqueIds.slice(i, i + CHUNK_SIZE);
    await Promise.all(chunk.map(async (promoter_id) => {
      const promoter = promoterMap.get(promoter_id);
      if (!promoter) {
        skipped.push({ promoter_id, promoter_name: '(unknown)', reason: 'Promoter not found.' });
        return;
      }
      if (alreadyAssigned.has(promoter_id)) {
        skipped.push({ promoter_id, promoter_name: promoter.name, reason: 'Already assigned to this event.' });
        return;
      }
      try {
        const link_slug = await uniqueAssignmentSlug(suggestLinkSlug(promoter.slug, event.name));
        await db.assignments.create(promoter_id, event_id, link_slug);
        created++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[assignments/bulk] create failed:', promoter_id, msg);
        const duplicate = msg.toLowerCase().includes('duplicate') || msg.includes('23505');
        skipped.push({
          promoter_id,
          promoter_name: promoter.name,
          reason: duplicate ? 'Already assigned to this event.' : msg,
        });
      }
    }));
  }

  if (created > 0) {
    revalidatePath(`/admin/events/${event.slug}`);
    revalidatePath('/admin/promoters');
  }

  return NextResponse.json({ created, skipped });
}
