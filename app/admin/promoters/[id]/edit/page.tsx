import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import EditPromoterForm from './EditPromoterForm';

export default async function EditPromoterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const promoter = await db.promoters.get(id);
  if (!promoter) notFound();

  return <EditPromoterForm promoter={promoter} />;
}
