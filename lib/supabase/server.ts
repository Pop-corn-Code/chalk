import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Use inside Server Components, Route Handlers, and Server Actions. Reads
// the user's session from cookies, so RLS policies see the real signed-in
// user — this is what makes `auth.uid()` work in the SQL policies.
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.\n' +
        '1. Copy .env.example to .env.local if you haven\'t already.\n' +
        '2. In Supabase: Project Settings → API Keys → "Publishable and secret API keys" tab.\n' +
        '   Use the Project URL + publishable key (or anon key, on older-style projects).\n' +
        '3. Restart the dev server (Next.js only reads .env.local at startup).'
    );
  }

  const cookieStore = cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Called from a Server Component with no writable cookie jar
          // (e.g. during a static render). Safe to ignore — middleware
          // handles the actual session refresh/write.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch {
          // See note above.
        }
      },
    },
  });
}

// Admin client: uses the service role key, which bypasses row-level
// security entirely. Only ever use this for operations a user genuinely
// can't do to themselves within RLS — here, that's deleting their own
// auth.users row (Supabase doesn't allow that from the client SDK).
// NEVER import this from a Client Component or expose the key with a
// NEXT_PUBLIC_ prefix.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local. ' +
        'In Supabase: Project Settings → API Keys → "Publishable and secret API keys" tab — ' +
        'use the secret key (or service_role key, on older-style projects). ' +
        'Restart the dev server after adding it.'
    );
  }

  return createSupabaseJsClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
