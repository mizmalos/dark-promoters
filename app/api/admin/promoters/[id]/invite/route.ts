import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureAuthUser } from '@/lib/supabase';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const promoter = await db.promoters.get(id);
  if (!promoter) return NextResponse.json({ error: 'Promoter not found.' }, { status: 404 });
  if (!promoter.email) return NextResponse.json({ error: 'This promoter has no email on file.' }, { status: 400 });

  const result = await ensureAuthUser(promoter.email);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });

  return NextResponse.json({ success: true });
}
