// Subscription plans. These are suggested starting prices, not something
// pulled from any analysis of your market — change freely. Everything
// that reads a price does so from this file, so editing it is the only
// step needed on the app side; the Stripe Price IDs still have to be
// created to match in your Stripe Dashboard (see README).

export interface Plan {
  id: 'free' | 'pro' | 'business';
  name: string;
  priceLabel: string; // display only
  monthlyAttempts: number | null; // null = unlimited
  stripePriceEnvVar?: 'STRIPE_PRICE_PRO' | 'STRIPE_PRICE_BUSINESS';
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    priceLabel: '$0',
    monthlyAttempts: 5,
    features: ['5 explanations per month', 'Up to 6,000 characters per attempt', 'Share links'],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceLabel: '$9/mo',
    monthlyAttempts: 200,
    stripePriceEnvVar: 'STRIPE_PRICE_PRO',
    features: ['200 explanations per month', 'Priority generation', 'API access', 'Email support'],
  },
  {
    id: 'business',
    name: 'Business',
    priceLabel: '$29/mo',
    monthlyAttempts: null,
    stripePriceEnvVar: 'STRIPE_PRICE_BUSINESS',
    features: ['Unlimited explanations', 'API access with higher rate limits', 'Priority support'],
  },
];

export function getPlan(id: string | null | undefined): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

// Used server-side to decide whether a signed-in user on the free plan can
// generate another explanation this calendar month. Pro/Business are
// checked against their own monthlyAttempts (Business is null = no cap).
export function monthStartISO(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

// e.g. "2026-10" — used to make sure a limit-warning email only sends once
// per user per calendar month, by comparing against profiles.limit_warning_sent_for.
export function currentMonthKey(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}
