import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureAuthUser } from '@/lib/supabase';
import { generateUniquePromoterSlug, generateUniquePromoterCode } from '@/lib/utils/promoter-codes';

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    name?: string;
    email?: string;
    phone?: string;
    instagram?: string;
    city?: string;
    state?: string;
  };

  const { name, email, phone, instagram, city, state } = body;

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
  }

  const normalEmail = email.trim().toLowerCase();

  // Reject duplicate email
  const existing = await db.promoters.getByEmail(normalEmail);
  if (existing) {
    return NextResponse.json(
      { error: 'That email is already registered. Sign in at /portal.' },
      { status: 409 },
    );
  }

  const slug = await generateUniquePromoterSlug(name.trim());
  const promo_code = await generateUniquePromoterCode(name.trim());

  await db.promoters.create({
    name: name.trim(),
    email: normalEmail,
    phone: phone?.trim() || null,
    instagram: instagram?.trim() || null,
    city: city?.trim() || null,
    state: (state as 'NSW' | 'VIC' | 'QLD' | 'ACT') || null,
    notes: null,
    slug,
    promo_code,
    is_active: true,
    source: 'self_serve',
  });

  // Silently provision their auth account — self-serve signups are disabled
  // project-wide, so signInWithOtp's shouldCreateUser can't do this; only the
  // admin API can create an account regardless of that restriction. No email
  // goes out here — their first email is the normal magic-link one, whenever
  // they actually request to sign in.
  const result = await ensureAuthUser(normalEmail);
  if (!result.ok) {
    console.error('[join] Account provisioning failed for', normalEmail, ':', result.error);
  }

  return NextResponse.json({ success: true, slug });
}
