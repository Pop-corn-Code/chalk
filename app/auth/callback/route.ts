import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// The link Supabase emails to the user points here with a `code` param.
// We exchange it for a real session (setting the auth cookies via the
// server client), then send the user on to wherever they were headed.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/tool';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
