import { createBrowserClient } from '@supabase/ssr';

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

  return createBrowserClient(url, anonKey);
}
