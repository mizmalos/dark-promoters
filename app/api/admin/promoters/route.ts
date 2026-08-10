import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';
import type { AustralianState } from '@/lib/types';

export async function GET() {
  return NextResponse.json(db.promoters.list());
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

  if (db.promoters.slugExists(slug)) {
    return NextResponse.json({ error: `Slug "${slug}" is already in use.` }, { status: 409 });
  }

  if (db.promoters.codeExists(promo_code)) {
    return NextResponse.json({ error: `Promo code "${promo_code}" is already in use.` }, { status: 409 });
  }

  const promoter = db.promoters.create({
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

  return NextResponse.json(promoter, { status: 201 });
}
