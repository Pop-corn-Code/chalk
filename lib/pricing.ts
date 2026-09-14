// Pricing model shared between the tool, the pricing calculator, and the
// profile usage meter, so the numbers can never drift apart between pages.
//
// NOTE: this is calculated client-side for display purposes only. If you
// wire up real billing (see README), the source of truth for what a user
// is actually charged must live server-side (e.g. reported to Stripe from
// the /api/generate route, using the same formula below), never trusted
// from the client.

export const PRICING = {
  freeAttempts: 5,
  attemptFee: 0.03,
  per500Chars: 0.01,
} as const;

export interface CostBreakdown {
  attemptFee: number;
  lengthFee: number;
  total: number;
  lengthBlocks: number;
}

export function estimateCost(charCount: number): CostBreakdown {
  const chars = Math.max(charCount, 1);
  const lengthBlocks = Math.ceil(chars / 500);
  const lengthFee = lengthBlocks * PRICING.per500Chars;
  return {
    attemptFee: PRICING.attemptFee,
    lengthFee,
    total: PRICING.attemptFee + lengthFee,
    lengthBlocks,
  };
}

export function formatCurrency(n: number): string {
  return `$${n.toFixed(2)}`;
}

export function isFreeAttempt(attemptNumber: number): boolean {
  return attemptNumber <= PRICING.freeAttempts;
}
