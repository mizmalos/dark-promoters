import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { db } from '@/lib/db';

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

// Minimal server-side Supabase client (no cookie persistence needed for signInWithOtp)
function makeSupabaseServer() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    },
  );
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
  });

  // Fire a magic link so they can sign in straight away
  const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_BASE_URL ?? 'https://dark-promoters.vercel.app';
  const supabase = makeSupabaseServer();
  await supabase.auth.signInWithOtp({
    email: normalEmail,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      shouldCreateUser: true, // create the auth user if not yet in auth.users
    },
  });

  return NextResponse.json({ success: true, slug });
}
