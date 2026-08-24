import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { suggestLinkSlug } from '@/lib/utils/tickets';

export async function POST(req: NextRequest) {
  // Handle both JSON and form submissions
  let body: Record<string, string>;
  const contentType = req.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    body = await req.json();
  } else {
    const fd = await req.formData();
    body = Object.fromEntries(fd.entries()) as Record<string, string>;
  }

  const { promoter_id, event_id, link_slug: rawSlug } = body;

  if (!promoter_id) return NextResponse.json({ error: 'promoter_id is required.' }, { status: 400 });
  if (!event_id)    return NextResponse.json({ error: 'event_id is required.' }, { status: 400 });

  const [promoter, event] = await Promise.all([
    db.promoters.get(promoter_id),
    db.events.get(event_id),
  ]);

  if (!promoter) return NextResponse.json({ error: 'Promoter not found.' }, { status: 404 });
  if (!event)    return NextResponse.json({ error: 'Event not found.' }, { status: 404 });

  // Auto-suggest slug if not provided
  const link_slug = rawSlug?.trim()
    ? rawSlug.trim().toLowerCase()
    : suggestLinkSlug(promoter.slug, event.name);

  if (!/^[a-z0-9-]+$/.test(link_slug)) {
    return NextResponse.json({ error: 'Link slug must be lowercase letters, numbers and hyphens.' }, { status: 400 });
  }

  if (await db.assignments.slugExists(link_slug)) {
    return NextResponse.json({ error: `Slug "${link_slug}" is already in use.` }, { status: 409 });
  }

  let assignment;
  try {
    assignment = await db.assignments.create(promoter_id, event_id, link_slug);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[assignments] create failed:', msg);
    if (!contentType.includes('application/json')) {
      return NextResponse.redirect(
        new URL(`/admin/events/${event_id}?error=${encodeURIComponent(msg)}`, req.url), 303
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  revalidatePath(`/admin/events/${event_id}`);
  revalidatePath(`/admin/promoters/${promoter.slug}`);
  revalidatePath('/admin/promoters');

  // Redirect back to event page for form submissions
  if (!contentType.includes('application/json')) {
    return NextResponse.redirect(new URL(`/admin/events/${event_id}`, req.url), 303);
  }

  return NextResponse.json(assignment, { status: 201 });
}
