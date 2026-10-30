import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  }

  const { data: profile } = await supabase.from('profiles').select('stripe_customer_id').eq('id', user.id).single();
  if (!profile?.stripe_customer_id) {
    return NextResponse.json(
      { error: "You don't have a billing account yet — subscribe to a plan first." },
      { status: 400 }
    );
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${appUrl}/profile`,
  });

  return NextResponse.json({ url: session.url });
}
