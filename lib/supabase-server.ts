// Server-side Supabase client — for Server Components, API routes, and middleware.
// Reads/writes auth cookies so sessions persist across requests.
// Import this in server components and route handlers, never in client components.
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll is called from a Server Component — cookies can only be
            // set in middleware or route handlers, so we silently ignore here.
          }
        },
      },
    },
  );
}
