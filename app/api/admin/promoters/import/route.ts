import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import Papa from 'papaparse';
import { db } from '@/lib/db';
import { ensureAuthUser } from '@/lib/supabase';
import { generateUniquePromoterSlug, generateUniquePromoterCode } from '@/lib/utils/promoter-codes';
import type { AustralianState } from '@/lib/types';

const MAX_ROWS = 1000;
const VALID_STATES = new Set<AustralianState>(['NSW', 'VIC', 'QLD', 'ACT']);

interface CsvRow {
  name?: string;
  email?: string;
  phone?: string;
  instagram?: string;
  city?: string;
  state?: string;
  notes?: string;
  promo_code?: string;
}

interface Skipped {
  row: number;
  name: string;
  email: string;
  reason: string;
}

interface AuthWarning {
  row: number;
  name: string;
  email: string;
  reason: string;
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { csv?: string };
  if (!body.csv?.trim()) {
    return NextResponse.json({ error: 'csv is required.' }, { status: 400 });
  }

  const parsed = Papa.parse<CsvRow>(body.csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  if (parsed.errors.length > 0) {
    return NextResponse.json({ error: `Could not parse CSV: ${parsed.errors[0].message}` }, { status: 400 });
  }

  const rows = parsed.data;
  if (rows.length === 0) {
    return NextResponse.json({ error: 'No rows found in CSV.' }, { status: 400 });
  }
  if (rows.length > MAX_ROWS) {
    return NextResponse.json({ error: `Too many rows (${rows.length}) — max ${MAX_ROWS} per import.` }, { status: 400 });
  }

  const skipped: Skipped[] = [];
  const authWarnings: AuthWarning[] = [];
  const seenEmails = new Set<string>();
  const seenCodes = new Set<string>();
  let created = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +1 for 0-index, +1 for the header row
    const name = row.name?.trim() ?? '';
    const emailRaw = row.email?.trim() ?? '';
    const email = emailRaw.toLowerCase();

    if (!name) {
      skipped.push({ row: rowNum, name, email, reason: 'Missing name.' });
      continue;
    }
    if (!email) {
      skipped.push({ row: rowNum, name, email, reason: 'Missing email.' });
      continue;
    }
    if (seenEmails.has(email)) {
      skipped.push({ row: rowNum, name, email, reason: 'Duplicate email within this file.' });
      continue;
    }
    if (await db.promoters.getByEmail(email)) {
      skipped.push({ row: rowNum, name, email, reason: 'Email already registered.' });
      continue;
    }

    const stateRaw = row.state?.trim().toUpperCase() ?? '';
    const state = VALID_STATES.has(stateRaw as AustralianState) ? (stateRaw as AustralianState) : null;

    const providedCode = row.promo_code?.trim().toUpperCase() ?? '';
    if (providedCode && seenCodes.has(providedCode)) {
      skipped.push({ row: rowNum, name, email, reason: 'Duplicate promo code within this file.' });
      continue;
    }
    if (providedCode && await db.promoters.codeExists(providedCode)) {
      skipped.push({ row: rowNum, name, email, reason: `Promo code "${providedCode}" is already in use.` });
      continue;
    }

    try {
      const slug = await generateUniquePromoterSlug(name);
      const promo_code = providedCode || await generateUniquePromoterCode(name);

      await db.promoters.create({
        name,
        email,
        phone: row.phone?.trim() || null,
        instagram: row.instagram?.trim() || null,
        city: row.city?.trim() || null,
        state,
        notes: row.notes?.trim() || null,
        slug,
        promo_code,
        is_active: true,
        source: 'admin',
      });

      seenEmails.add(email);
      if (providedCode) seenCodes.add(providedCode);
      created++;

      const result = await ensureAuthUser(email);
      if (!result.ok) {
        console.error('[promoters/import] Account provisioning failed for', email, ':', result.error);
        authWarnings.push({ row: rowNum, name, email, reason: result.error });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[promoters/import] create failed:', email, msg);
      skipped.push({ row: rowNum, name, email, reason: msg });
    }
  }

  if (created > 0) revalidatePath('/admin/promoters');

  return NextResponse.json({ created, skipped, authWarnings });
}
