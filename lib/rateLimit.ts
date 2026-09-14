// A minimal in-memory rate limiter, keyed by IP.
//
// IMPORTANT LIMITATION: this state lives in the Node process's memory. It
// works fine on a single long-running server, but on serverless platforms
// (Vercel, etc.) each instance has its own memory, cold starts wipe it, and
// traffic can be spread across many instances — so this will under-count
// real-world abuse. For production, replace this with a shared store like
// Upstash Redis (a few lines with @upstash/ratelimit) so all instances see
// the same counters. This version is here so the route isn't wide open
// while you wire that up.

interface Bucket {
  count: number;
  windowStart: number;
}

const WINDOW_MS = 60_000; // 1 minute
const MAX_PER_WINDOW = 12; // generous — tune to your real usage patterns

const buckets = new Map<string, Bucket>();

export function checkRateLimit(key: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (bucket.count >= MAX_PER_WINDOW) {
    return { allowed: false, retryAfterMs: WINDOW_MS - (now - bucket.windowStart) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

export function getClientKey(headers: Headers): string {
  // Behind most reverse proxies / platforms this header carries the real
  // client IP. Fall back to a constant so local dev doesn't throw.
  const forwarded = headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || 'local';
}
