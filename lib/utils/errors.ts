/**
 * Extract a readable message from a thrown value. Supabase/postgrest-js can
 * throw a plain { message, details, hint, code } object instead of a real
 * Error on network-level failures, so `err instanceof Error` alone silently
 * discards the actual message.
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  return String(err);
}
