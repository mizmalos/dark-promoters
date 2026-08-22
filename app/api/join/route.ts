import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureAuthUser } from '@/lib/supabase';

// Generate a URL-safe slug from a name, with collision avoidance
async function generateUniqueSlug(name: string): Promise<string> {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  let slug = base;
  let attempt = 1;
  while (await db.promoters.slugExists(slug)) {
    slug = `${base}-${attempt++}`;
  }
  return slug;
}

// Generate a promo code from first name, with collision avoidance
async function generateUniqueCode(name: string): Promise<string> {
  const first = name.split(/\s+/)[0].toUpperCase().replace(/[^A-Z0-9]/g, '');
  let code = first;
  let attempt = 1;
  while (await db.promoters.codeExists(code)) {
    code = `${first}${attempt++}`;
  }
  return code;
}

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

  const slug = await generateUniqueSlug(name.trim());
  const promo_code = await generateUniqueCode(name.trim());

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
