import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { inviteAuthUser } from '@/lib/supabase';
import type { AustralianState } from '@/lib/types';

export async function GET() {
  return NextResponse.json(await db.promoters.list());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, phone, instagram, city, state, notes, slug, promo_code } = body;

  if (!name?.trim())        return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  if (!slug?.trim())        return NextResponse.json({ error: 'Slug is required.' }, { status: 400 });
  if (!promo_code?.trim())  return NextResponse.json({ error: 'Promo code is required.' }, { status: 400 });

  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: 'Slug must be lowercase letters, numbers and hyphens only.' }, { status: 400 });
  }

  if (await db.promoters.slugExists(slug)) {
    return NextResponse.json({ error: `Slug "${slug}" is already in use.` }, { status: 409 });
  }

  if (await db.promoters.codeExists(promo_code)) {
    return NextResponse.json({ error: `Promo code "${promo_code}" is already in use.` }, { status: 409 });
  }

  const promoter = await db.promoters.create({
    name: name.trim(),
    email: email?.trim() || null,
    phone: phone?.trim() || null,
    instagram: instagram?.trim() || null,
    city: city?.trim() || null,
    state: (state as AustralianState) || null,
    notes: notes?.trim() || null,
    slug: slug.trim().toLowerCase(),
    promo_code: promo_code.trim().toUpperCase(),
    is_active: true,
  });

  revalidatePath('/admin/promoters');

  let invite_warning: string | undefined;
  if (promoter.email) {
    const result = await inviteAuthUser(promoter.email);
    if (!result.ok) invite_warning = result.error;
  }

  return NextResponse.json({ ...promoter, invite_warning }, { status: 201 });
}
