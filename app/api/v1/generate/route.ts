import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { callGemini } from '@/lib/gemini';
import { createAdminClient } from '@/lib/supabase/server';
import { getUsageStatus, isOverLimit, recordUsage } from '@/lib/usageTracking';
import type { GenerateResponse, GenerateErrorResponse } from '@/lib/types';

export const runtime = 'nodejs';

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return NextResponse.json<GenerateErrorResponse>(
      { error: 'Missing API key. Send it as "Authorization: Bearer sk_chalk_..."' },
      { status: 401 }
    );
  }
  const providedKey = match[1];

  // No Supabase session exists for a raw API key request, so RLS can't
  // scope anything for us here — the admin client is used throughout this
  // route, with the API key itself acting as the proof of identity. Every
  // query below is explicitly filtered to the single user_id resolved from
  // the key, never trusting anything the caller supplies directly.
  const admin = createAdminClient();

  const keyHash = hashKey(providedKey);
  const { data: keyRow, error: keyError } = await admin
    .from('api_keys')
    .select('id, user_id, revoked_at')
    .eq('key_hash', keyHash)
    .single();

  if (keyError || !keyRow || keyRow.revoked_at) {
    return NextResponse.json<GenerateErrorResponse>({ error: 'Invalid or revoked API key.' }, { status: 401 });
  }

  // Rate-limited per key, not per IP — keeps API traffic from an
  // integration separate from the website's own IP-based bucket.
  const rate = await checkRateLimit(`apikey:${keyRow.id}`);
  if (!rate.allowed) {
    return NextResponse.json<GenerateErrorResponse>(
      { error: 'Too many requests. Please wait a moment and try again.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rate.retryAfterMs / 1000)) } }
    );
  }

  let body: { text?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<GenerateErrorResponse>({ error: 'Invalid request body.' }, { status: 400 });
  }
  if (typeof body.text !== 'string' || !body.text.trim()) {
    return NextResponse.json<GenerateErrorResponse>({ error: 'Missing "text" in request body.' }, { status: 400 });
  }

  const { data: userResult, error: userError } = await admin.auth.admin.getUserById(keyRow.user_id);
  if (userError || !userResult?.user) {
    return NextResponse.json<GenerateErrorResponse>({ error: 'Could not resolve the account for this key.' }, { status: 500 });
  }
  const user = userResult.user;

  const usageStatus = await getUsageStatus(admin, user.id);

  if (usageStatus.plan === 'free') {
    return NextResponse.json<GenerateErrorResponse>(
      { error: 'API access requires a Pro or Business plan. Upgrade at /pricing.' },
      { status: 403 }
    );
  }

  if (isOverLimit(usageStatus)) {
    return NextResponse.json<GenerateErrorResponse>(
      { error: `You've used all ${usageStatus.cap} explanations included in your plan this month.`, code: 'LIMIT_REACHED' },
      { status: 402 }
    );
  }

  const result = await callGemini(body.text);
  if (!result.ok) {
    return NextResponse.json<GenerateErrorResponse>({ error: result.error }, { status: result.status });
  }

  const name = (user.user_metadata?.full_name as string) || user.email || 'there';
  await recordUsage(admin, user.id, user.email || '', name, body.text.trim().slice(0, 6000).length, usageStatus);
  await admin.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', keyRow.id);

  return NextResponse.json<GenerateResponse>({ concepts: result.concepts });
}
