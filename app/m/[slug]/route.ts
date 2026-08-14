import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buildEventbriteUrl, isSafeRedirectUrl } from '@/lib/utils/tickets';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const assignment = await db.assignments.getBySlug(slug);

  if (!assignment) {
    return new NextResponse(
      `<!DOCTYPE html><html><head><title>Link not found — DARK</title></head>
      <body style="font-family:sans-serif;text-align:center;padding:80px">
        <h1>Link not found</h1>
        <p>This promoter link doesn't exist or has been deactivated.</p>
      </body></html>`,
      { status: 404, headers: { 'Content-Type': 'text/html' } }
    );
  }

  if (!assignment.is_active || !assignment.event.is_active) {
    return new NextResponse(
      `<!DOCTYPE html><html><head><title>Link inactive — DARK</title></head>
      <body style="font-family:sans-serif;text-align:center;padding:80px">
        <h1>This link is no longer active</h1>
        <p>Check with your promoter for an updated link.</p>
      </body></html>`,
      { status: 410, headers: { 'Content-Type': 'text/html' } }
    );
  }

  const destination = buildEventbriteUrl(
    assignment.event.eventbrite_url,
    assignment.promoter.promo_code
  );

  // Safety check — must be an Eventbrite URL
  if (!isSafeRedirectUrl(destination)) {
    return new NextResponse('Invalid redirect destination.', { status: 400 });
  }

  return NextResponse.redirect(destination, { status: 302 });
}
