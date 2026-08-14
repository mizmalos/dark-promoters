import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getOrganizationId, createPromoCode } from '@/lib/eventbrite/api';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const promoter = await db.promoters.get(id);
  if (!promoter) return NextResponse.json({ error: 'Promoter not found.' }, { status: 404 });

  try {
    const orgId = await getOrganizationId();
    const result = await createPromoCode(orgId, promoter.promo_code);
    return NextResponse.json({ success: true, code: result.code });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    // If the code already exists on Eventbrite, that's fine
    if (message.toLowerCase().includes('already exists') || message.includes('409')) {
      return NextResponse.json({ success: true, code: promoter.promo_code, note: 'Code already exists on Eventbrite.' });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
