import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const secret = process.env.EVENTBRITE_SESSION_WRITE_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'EVENTBRITE_SESSION_WRITE_SECRET is not configured.' }, { status: 500 });
  }

  const auth = req.headers.get('authorization') ?? '';
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const body = await req.json() as { cookie?: string; refreshed_by?: string };
  const cookie = body.cookie?.trim();
  if (!cookie) {
    return NextResponse.json({ error: 'cookie is required.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('eventbrite_session')
    .upsert({ id: 1, cookie, refreshed_by: body.refreshed_by?.trim() || null, refreshed_at: new Date().toISOString() })
    .select('refreshed_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, refreshed_at: data.refreshed_at });
}
