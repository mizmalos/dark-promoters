import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { AustralianState } from '@/lib/types';

export async function GET() {
  return NextResponse.json(await db.events.list());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, venue, city, state, event_date, eventbrite_url, eventbrite_event_id } = body;

  if (!name?.trim())           return NextResponse.json({ error: 'Event name is required.' }, { status: 400 });
  if (!eventbrite_url?.trim()) return NextResponse.json({ error: 'Eventbrite URL is required.' }, { status: 400 });

  // Validate Eventbrite URL domain
  try {
    const url = new URL(eventbrite_url);
    if (!url.hostname.includes('eventbrite.com')) {
      return NextResponse.json({ error: 'URL must be an Eventbrite domain.' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid Eventbrite URL.' }, { status: 400 });
  }

  const event = await db.events.create({
    name: name.trim(),
    description: description?.trim() || null,
    venue: venue?.trim() || null,
    city: city?.trim() || null,
    state: (state as AustralianState) || null,
    event_date: event_date || null,
    eventbrite_url: eventbrite_url.trim(),
    eventbrite_event_id: eventbrite_event_id?.trim() || null,
    is_active: true,
  });

  return NextResponse.json(event, { status: 201 });
}
