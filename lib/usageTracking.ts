import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/server';
import { getPlan, monthStartISO, currentMonthKey } from '@/lib/plans';
import { sendLimitWarningEmail } from '@/lib/email';
import type { PlanId } from '@/lib/types';

interface UsageStatus {
  plan: PlanId;
  used: number;
  cap: number | null; // null = unlimited
  limitWarningSentFor: string | null;
}

// Read with the caller's own Supabase client (not admin) — both `profiles`
// and `usage_events` have select policies scoped to auth.uid(), so this
// runs with the real signed-in user's permissions, nothing elevated.
export async function getUsageStatus(supabase: SupabaseClient, userId: string): Promise<UsageStatus> {
  const [{ data: profile }, { count }] = await Promise.all([
    supabase.from('profiles').select('plan, limit_warning_sent_for').eq('id', userId).single(),
    supabase
      .from('usage_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', monthStartISO()),
  ]);

  const planId = (profile?.plan as PlanId) || 'free';
  return {
    plan: planId,
    used: count ?? 0,
    cap: getPlan(planId).monthlyAttempts,
    limitWarningSentFor: profile?.limit_warning_sent_for ?? null,
  };
}

export function isOverLimit(status: UsageStatus): boolean {
  return status.cap !== null && status.used >= status.cap;
}

// Called after a successful generation. Inserting into usage_events needs
// the admin client — see supabase/schema.sql, there's deliberately no
// client-insert policy on that table, so a user can't edit their own
// billing history. Updating profiles.limit_warning_sent_for, by contrast,
// uses the caller's own client since users are allowed to update their own
// profile row.
export async function recordUsage(
  supabase: SupabaseClient,
  userId: string,
  email: string,
  name: string,
  charCount: number,
  statusBeforeThisAttempt: UsageStatus
) {
  const admin = createAdminClient();
  const { error } = await admin.from('usage_events').insert({ user_id: userId, char_count: charCount, billable: true });
  if (error) {
    console.error('[usageTracking] failed to record usage event:', error);
  }

  const newUsed = statusBeforeThisAttempt.used + 1;
  const { plan, cap, limitWarningSentFor } = statusBeforeThisAttempt;
  const shouldWarn =
    plan === 'free' &&
    cap !== null &&
    newUsed >= Math.ceil(cap * 0.8) &&
    limitWarningSentFor !== currentMonthKey();

  if (shouldWarn) {
    const monthKey = currentMonthKey();
    // Fire and forget — an email failing shouldn't affect the response the
    // user is waiting on. Mark as sent first so a slow/failed email send
    // can't cause duplicate sends on the next request.
    await supabase.from('profiles').update({ limit_warning_sent_for: monthKey }).eq('id', userId);
    sendLimitWarningEmail(email, name, newUsed, cap!).catch((err) =>
      console.error('[usageTracking] limit-warning email failed:', err)
    );
  }
}
