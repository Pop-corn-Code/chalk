import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

// Lazily constructed, same pattern as the Supabase admin client — importing
// this module shouldn't throw just because STRIPE_SECRET_KEY isn't set yet
// (e.g. in an environment that only needs the free tier). Each route that
// actually needs Stripe calls this and gets a clear error if the key is
// missing, rather than every page load failing.
export function getStripe(): Stripe {
  if (stripeClient) return stripeClient;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      'Missing STRIPE_SECRET_KEY. Set it in .env.local (see .env.example) — get test keys at ' +
        'https://dashboard.stripe.com/test/apikeys'
    );
  }

  stripeClient = new Stripe(key, { apiVersion: '2024-06-20' });
  return stripeClient;
}
