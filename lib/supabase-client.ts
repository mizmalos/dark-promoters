// Browser-side Supabase client — safe to import in 'use client' components.
// Uses NEXT_PUBLIC_* env vars (anon key only — never the service role key).
import { createBrowserClient } from '@supabase/ssr';

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
