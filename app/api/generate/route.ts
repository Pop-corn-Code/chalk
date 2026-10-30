import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientKey } from '@/lib/rateLimit';
import { callGemini } from '@/lib/gemini';
import { createClient } from '@/lib/supabase/server';
import { getUsageStatus, isOverLimit, recordUsage } from '@/lib/usageTracking';
import type { GenerateResponse, GenerateErrorResponse } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const clientKey = getClientKey(req.headers);
  const rate = await checkRateLimit(clientKey);
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

  // Anonymous visitors can generate freely, protected only by the IP rate
  // limit above — no account needed to try the tool. Plan limits only
  // apply once someone is signed in, since that's the only case where
  // usage can be durably tracked and tied to billing.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let usageStatus = null;
  if (user) {
    usageStatus = await getUsageStatus(supabase, user.id);
    if (isOverLimit(usageStatus)) {
      return NextResponse.json<GenerateErrorResponse>(
        {
          error: `You've used all ${usageStatus.cap} explanations included in your plan this month.`,
          code: 'LIMIT_REACHED',
        },
        { status: 402 }
      );
    }
  }

  const result = await callGemini(body.text);
  if (!result.ok) {
    return NextResponse.json<GenerateErrorResponse>({ error: result.error }, { status: result.status });
  }

  if (user && usageStatus) {
    const name = (user.user_metadata?.full_name as string) || user.email || 'there';
    await recordUsage(supabase, user.id, user.email || '', name, body.text.trim().slice(0, 6000).length, usageStatus);
  }

  return NextResponse.json<GenerateResponse>({ concepts: result.concepts });
}
