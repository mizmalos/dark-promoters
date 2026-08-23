import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import type { AustralianState } from '@/lib/types';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const promoter = await db.promoters.get(id);
  if (!promoter) return NextResponse.json({ error: 'Promoter not found.' }, { status: 404 });

  const body = await req.json();
  const { name, email, phone, instagram, city, state, notes, is_active } = body;

  if (!name?.trim()) return NextResponse.json({ error: 'Name is required.' }, { status: 400 });

  const normalEmail = email?.trim() ? email.trim().toLowerCase() : null;
  if (normalEmail) {
    const existing = await db.promoters.getByEmail(normalEmail);
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: `Email "${normalEmail}" is already used by another promoter.` }, { status: 409 });
    }
  }

  const updated = await db.promoters.update(id, {
    name: name.trim(),
    email: normalEmail,
    phone: phone?.trim() || null,
    instagram: instagram?.trim() || null,
    city: city?.trim() || null,
    state: (state as AustralianState) || null,
    notes: notes?.trim() || null,
    is_active: typeof is_active === 'boolean' ? is_active : promoter.is_active,
  });

  revalidatePath('/admin/promoters');
  revalidatePath(`/admin/promoters/${id}`);

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const promoter = await db.promoters.get(id);
  if (!promoter) return NextResponse.json({ error: 'Promoter not found.' }, { status: 404 });

  await db.promoters.delete(id);

  revalidatePath('/admin/promoters');

  return NextResponse.json({ success: true });
}
