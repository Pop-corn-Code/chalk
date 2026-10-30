import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';
import { getPlan } from '@/lib/plans';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  }

  let body: { plan?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const plan = getPlan(body.plan);
  if (plan.id === 'free' || !plan.stripePriceEnvVar) {
    return NextResponse.json({ error: 'Not a purchasable plan.' }, { status: 400 });
  }

  const priceId = process.env[plan.stripePriceEnvVar];
  if (!priceId) {
    return NextResponse.json(
      { error: `Server is missing ${plan.stripePriceEnvVar}. Set it in .env.local (see .env.example).` },
      { status: 500 }
    );
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  // Reuse an existing Stripe customer if this user already has one
  // (e.g. they're switching plans), otherwise create one and save it —
  // own-row update, allowed by the profiles RLS policy.
  const { data: profile } = await supabase.from('profiles').select('stripe_customer_id').eq('id', user.id).single();

  let customerId = profile?.stripe_customer_id as string | undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/profile?checkout=success`,
    cancel_url: `${appUrl}/pricing?checkout=cancelled`,
    metadata: { supabase_user_id: user.id, plan: plan.id },
    subscription_data: { metadata: { supabase_user_id: user.id, plan: plan.id } },
  });

  if (!session.url) {
    return NextResponse.json({ error: 'Stripe did not return a checkout URL.' }, { status: 502 });
  }

  return NextResponse.json({ url: session.url });
}
