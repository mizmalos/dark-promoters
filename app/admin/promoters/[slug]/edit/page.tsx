import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import EditPromoterForm from './EditPromoterForm';

export default async function EditPromoterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const promoter = await db.promoters.getBySlug(slug);
  if (!promoter) notFound();

  return <EditPromoterForm promoter={promoter} />;
}
