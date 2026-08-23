import { db } from '@/lib/db';

/** Generate a URL-safe slug from a name, with collision avoidance. */
export async function generateUniquePromoterSlug(name: string, excludeId?: string): Promise<string> {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  let slug = base;
  let attempt = 1;
  while (await db.promoters.slugExists(slug, excludeId)) {
    slug = `${base}-${attempt++}`;
  }
  return slug;
}

/** Generate a promo code from a first name, with collision avoidance. */
export async function generateUniquePromoterCode(name: string): Promise<string> {
  const first = name.split(/\s+/)[0].toUpperCase().replace(/[^A-Z0-9]/g, '');
  let code = first;
  let attempt = 1;
  while (await db.promoters.codeExists(code)) {
    code = `${first}${attempt++}`;
  }
  return code;
}
