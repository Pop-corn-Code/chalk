import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// Deleting your own auth.users row isn't something the regular Supabase
// client can do (by design — it would let a stolen session token delete
// the account). It requires the service role key, which must never reach
// the browser, so this has to be a server route: verify who's asking
// using their session cookie, then use the admin client to do the actual
// delete. The `profiles` and `history` tables both have
// `on delete cascade` foreign keys to auth.users, so this removes
// everything for that user in one call.
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    console.error('[api/account/delete] failed to delete user:', deleteError);
    return NextResponse.json({ error: 'Could not delete account. Try again.' }, { status: 500 });
  }

  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
