'use client';

// Generates and hashes API keys entirely in the browser using the Web
// Crypto API. Only the hash is ever sent to the database (via the normal
// Supabase client, allowed by the api_keys insert policy in
// supabase/schema.sql) — the full key is shown to the user exactly once,
// at creation, and is unrecoverable after that, same as GitHub/Stripe-style
// API keys. The server (app/api/v1/generate/route.ts) hashes an incoming
// key the same way with Node's crypto.createHash('sha256') to find the
// matching row — both sides hash the identical UTF-8 string, so the
// digests match.

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sha256Hex(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return bytesToHex(new Uint8Array(digest));
}

export async function generateApiKey(): Promise<{ fullKey: string; hash: string; prefix: string }> {
  const bytes = crypto.getRandomValues(new Uint8Array(24)); // 192 bits of entropy
  const fullKey = `sk_chalk_${bytesToHex(bytes)}`;
  const hash = await sha256Hex(fullKey);
  const prefix = fullKey.slice(0, 17); // e.g. "sk_chalk_a1b2c3d" — enough to tell keys apart in a list
  return { fullKey, hash, prefix };
}
