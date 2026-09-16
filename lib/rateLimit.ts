// Rate limiting, keyed by IP.
//
// If UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are set, this uses
// Upstash Redis via @upstash/ratelimit — a real, shared counter that every
// server instance sees the same way, so it holds up correctly on
// serverless platforms (Vercel, etc.) with multiple instances and cold
// starts.
//
// If those env vars aren't set (e.g. local development without an Upstash
// account), it falls back to the same in-memory limiter as before. That
// fallback still has the original limitation — separate memory per
// instance, wiped on restart — so treat it as "good enough for local dev
// and single-instance deployments," not a substitute for Upstash in real
// production traffic.

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const WINDOW_SECONDS = 60;
const MAX_PER_WINDOW = 12; // generous — tune to your real usage patterns

interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
}

// --- Upstash-backed limiter, created once and reused across requests ---
let upstashLimiter: Ratelimit | null = null;
let upstashInitAttempted = false;

function getUpstashLimiter(): Ratelimit | null {
  if (upstashInitAttempted) return upstashLimiter;
  upstashInitAttempted = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    const redis = new Redis({ url, token });
    upstashLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(MAX_PER_WINDOW, `${WINDOW_SECONDS} s`),
      analytics: true,
      prefix: 'chalk:generate',
    });
  } catch (err) {
    console.error('[rateLimit] failed to initialize Upstash client, falling back to in-memory:', err);
    upstashLimiter = null;
  }

  return upstashLimiter;
}

// --- In-memory fallback, identical to the original implementation ---
interface Bucket {
  count: number;
  windowStart: number;
}
const memoryBuckets = new Map<string, Bucket>();

function checkMemoryRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const windowMs = WINDOW_SECONDS * 1000;
  const bucket = memoryBuckets.get(key);

  if (!bucket || now - bucket.windowStart > windowMs) {
    memoryBuckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (bucket.count >= MAX_PER_WINDOW) {
    return { allowed: false, retryAfterMs: windowMs - (now - bucket.windowStart) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

export async function checkRateLimit(key: string): Promise<RateLimitResult> {
  const limiter = getUpstashLimiter();

  if (!limiter) {
    return checkMemoryRateLimit(key);
  }

  try {
    const result = await limiter.limit(key);
    return {
      allowed: result.success,
      retryAfterMs: result.success ? 0 : Math.max(result.reset - Date.now(), 0),
    };
  } catch (err) {
    // Upstash unreachable — fail open rather than blocking every request,
    // but log it since a persistently failing Redis connection is worth
    // noticing.
    console.error('[rateLimit] Upstash request failed, allowing request through:', err);
    return { allowed: true, retryAfterMs: 0 };
  }
}

export function getClientKey(headers: Headers): string {
  // Behind most reverse proxies / platforms this header carries the real
  // client IP. Fall back to a constant so local dev doesn't throw.
  const forwarded = headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || 'local';
}
