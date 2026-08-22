import { db } from '@/lib/db';

/**
 * Resolve a link slug to one that isn't already in use, suffixing with
 * -1, -2, ... on collision. Collisions are rare in practice (promoter
 * slugs are unique) but this keeps bulk assignment from ever 409-ing.
 */
export async function uniqueAssignmentSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let attempt = 1;
  while (await db.assignments.slugExists(slug)) {
    slug = `${baseSlug}-${attempt++}`;
  }
  return slug;
}
