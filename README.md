# Chalk

Turn dense text into a few simple, sketch-style visual explanations.

This is a Next.js (App Router + TypeScript + Tailwind) port of a static HTML
prototype. Two things now run for real instead of being mocked:

- **The Anthropic call happens on the server** (`app/api/generate/route.ts`),
  so the API key never reaches the browser.
- **Auth and search history are backed by Supabase** (Postgres + Auth), with
  row-level security enforcing that a user can only ever see their own data
  — see `supabase/schema.sql`.

## Quick start

1. **Anthropic key**
   ```bash
   cp .env.example .env.local
   # set ANTHROPIC_API_KEY=sk-ant-... in .env.local
   ```

2. **Supabase project**
   - Create a project at [supabase.com](https://supabase.com).
   - Go to the SQL Editor, paste the contents of `supabase/schema.sql`, and
     run it. This creates the `profiles` and `history` tables with RLS.
   - Go to Project Settings → API Keys and copy three values into
     `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
     and `SUPABASE_SERVICE_ROLE_KEY` (see `.env.example` for exactly which
     field each one is — Supabase has renamed these "publishable" and
     "secret" keys on newer projects, same values either way).
   - Go to Authentication → URL Configuration and add
     `http://localhost:3000/auth/callback` as a redirect URL (and your real
     domain's equivalent once deployed).
   - Magic-link emails send automatically using Supabase's built-in email
     service in development. For production volume, connect your own SMTP
     provider under Authentication → Email Templates / SMTP Settings.

3. **Google sign-in** (optional — magic link works without this)
   - In [Google Cloud Console](https://console.cloud.google.com/apis/credentials),
     create an OAuth 2.0 Client ID (Application type: Web application).
   - Add this Authorized redirect URI — copy it exactly from Supabase
     (Authentication → Providers → Google shows the exact URL for your
     project, it looks like `https://<project-ref>.supabase.co/auth/v1/callback`).
   - Back in Supabase: Authentication → Providers → Google → enable it, and
     paste in the Client ID and Client Secret Google gave you.
   - No changes needed in `.env.local` for this — it's configured entirely
     in the Supabase dashboard. `components/SignInModal.tsx` already has a
     "Continue with Google" button wired up via
     `supabase.auth.signInWithOAuth`.
   - Google fills in the user's name and profile photo automatically; the
     `profiles` table trigger picks both up on first sign-in (see
     `supabase/schema.sql`), and `components/Avatar.tsx` shows the real
     photo instead of colored initials when one's available.

4. **Install and run**
   ```bash
   npm install
   npm run dev
   ```

Open http://localhost:3000 and click "Sign in." Magic link: check your
inbox (Supabase's default email service can be slow or land in spam for
brand-new projects — check the Supabase dashboard's Auth logs if it doesn't
arrive). Google: click through the consent screen, no email needed.

## What's real vs. what's a demo

| Feature | Status |
|---|---|
| Generating explanations | **Real.** Calls Anthropic via a server route. |
| API key handling | **Real.** Server-side only, never sent to the client. |
| Sign in | **Real.** Supabase Auth — passwordless magic link, or Google. No passwords stored anywhere. |
| User profile | **Real.** `profiles` table, one row per user, created automatically on signup. |
| History | **Real.** `history` table, row-level security scoped to `auth.uid()` — a user can only ever query their own rows, enforced by Postgres. |
| Delete account | **Real.** `app/api/account/delete/route.ts` deletes the `auth.users` row; `profiles` and `history` cascade-delete with it. |
| Per-IP rate limiting | **Partial.** In-memory (see `lib/rateLimit.ts`) — works, but won't hold up across multiple server instances. Fine for a single server or low traffic; swap for Upstash Redis before it matters. |
| Pricing / usage meter | **Demo.** Calculated correctly and live from real attempts and text length, but nothing is actually charged, and it isn't persisted — it resets on refresh even when signed in. See "Next steps" to make this real. |
| Terms / Privacy pages | **Template.** Accurate to what this codebase does, but not reviewed by a lawyer. Update before real use. |

## Project structure

```
app/
  page.tsx              landing page
  tool/page.tsx          the actual tool (client component)
  profile/page.tsx        account + history (client component)
  pricing/page.tsx        plans, calculator, usage meter (client component)
  terms/page.tsx           static
  privacy/page.tsx          static
  api/
    generate/route.ts        server-side Anthropic call
    account/delete/route.ts    deletes a user's account (service role)
  auth/
    callback/route.ts          exchanges the magic-link code for a session
    auth-code-error/page.tsx    fallback if the link is invalid/expired
  layout.tsx                     fonts, providers, nav/footer shell
  globals.css                      chalk theme CSS variables (dark + light)
components/
  NavBar.tsx, Footer.tsx, SignInModal.tsx, IconSvg.tsx, Avatar.tsx, ThemeBody.tsx
lib/
  AppStateContext.tsx   session state: real Supabase auth + history, in-memory pricing/theme
  supabase/client.ts       browser Supabase client
  supabase/server.ts        server Supabase client + admin (service role) client
  pricing.ts                  shared cost-calculation formula
  sanitizeIcon.ts                SVG allowlist sanitizer (client) + basic server stripping
  rateLimit.ts                     in-memory per-IP limiter
  types.ts                           shared TypeScript types
middleware.ts            refreshes the Supabase session cookie on every request
supabase/schema.sql        run this in the Supabase SQL editor — tables + RLS policies
```

## Next steps to make this a real product

### 1. Real billing — Stripe metered billing

- Create a metered Price in Stripe for the per-attempt + per-character usage
  described in `lib/pricing.ts`.
- From `app/api/generate/route.ts`, after a successful generation, report a
  usage record to Stripe (`stripe.billing.meterEvents.create` for the new
  Billing Meters API, or `subscriptionItems.createUsageRecord` for the
  legacy API) using the *same* formula as `estimateCost()` — the client-side
  numbers in this repo are for display only and must not be the billing
  source of truth.
- Add a Stripe Checkout / Customer Portal flow so users can add a payment
  method once they exceed the free tier.

### 2. Real rate limiting — Upstash Redis

- `lib/rateLimit.ts` is in-memory and per-instance. Swap it for
  `@upstash/ratelimit` + `@upstash/redis` (a few lines) so limits hold across
  serverless instances and restarts.

### 3. Content moderation

- The system prompt in `app/api/generate/route.ts` asks the model to behave,
  but there's no separate moderation layer. If this becomes public, consider
  logging/monitoring generated output or adding a moderation pass.

### 4. Legal review

- `app/terms/page.tsx` and `app/privacy/page.tsx` are accurate to *this*
  codebase but are templates, not legal advice. Have a lawyer review them
  against your actual jurisdiction and data flows before shipping.

## Deploying

This is a standard Next.js app — deploys to Vercel with zero config
(`vercel deploy`), or anywhere else that runs Node (Render, Railway, a plain
VPS with `npm run build && npm start`). Set all five env vars from
`.env.example` on whatever platform you use — `ANTHROPIC_API_KEY` and
`SUPABASE_SERVICE_ROLE_KEY` must stay server-side only, never committed and
never given a `NEXT_PUBLIC_` prefix.

Two things to do once you have a real domain:
- In Supabase, Authentication → URL Configuration: add
  `https://yourdomain.com/auth/callback` as a redirect URL (keep the
  localhost one too if you still develop locally).
- Set the Supabase project's "Site URL" to your production domain, so magic
  links point at the right place by default.
