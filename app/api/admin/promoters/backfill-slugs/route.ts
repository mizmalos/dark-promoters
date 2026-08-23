import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { generateUniquePromoterSlug } from '@/lib/utils/promoter-codes';

// One-time migration: some promoters (added via the admin "Add Promoter" form
// before it was fixed to derive the slug from the name field) ended up with a
// promo-code-based slug instead of a name-based one. Regenerates every
// promoter's slug from their current name for consistency, then this route
// should be deleted.
export async function POST() {
  const promoters = await db.promoters.list();
  const changed: { id: string; name: string; oldSlug: string; newSlug: string }[] = [];

  for (const p of promoters) {
    const newSlug = await generateUniquePromoterSlug(p.name, p.id);
    if (newSlug !== p.slug) {
      await db.promoters.update(p.id, { slug: newSlug });
      changed.push({ id: p.id, name: p.name, oldSlug: p.slug, newSlug });
    }
  }

  if (changed.length > 0) revalidatePath('/admin/promoters');

  return NextResponse.json({ total: promoters.length, changed });
}
