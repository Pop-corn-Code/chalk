import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';
import type Stripe from 'stripe';

export const runtime = 'nodejs';

// Stripe signs the raw request body, so this route reads it as text
// (req.text()) rather than req.json() — parsing and re-serializing would
// change the bytes and break signature verification.
export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 500 });
  }

  const rawBody = await req.text();

  let stripe;
  let event: Stripe.Event;
  try {
    stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('[stripe webhook] signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const plan = session.metadata?.plan;
        if (userId && plan) {
          await admin
            .from('profiles')
            .update({
              plan,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              subscription_status: 'active',
            })
            .eq('id', userId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;
        const plan = subscription.metadata?.plan;
        if (userId) {
          const downgraded = ['canceled', 'unpaid', 'incomplete_expired'].includes(subscription.status);
          await admin
            .from('profiles')
            .update({
              subscription_status: subscription.status,
              plan: downgraded ? 'free' : plan || undefined,
            })
            .eq('id', userId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;
        if (userId) {
          await admin
            .from('profiles')
            .update({ plan: 'free', subscription_status: 'canceled' })
            .eq('id', userId);
        }
        break;
      }

      default:
        // Other event types aren't acted on — Stripe sends many more than
        // this app needs to react to.
        break;
    }
  } catch (err) {
    console.error('[stripe webhook] failed to process event:', event.type, err);
    return NextResponse.json({ error: 'Failed to process event.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
