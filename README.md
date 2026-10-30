# Chalk

Turn dense text into a few simple, sketch-style visual explanations.

This is a Next.js (App Router + TypeScript + Tailwind) port of a static HTML
prototype. Two things now run for real instead of being mocked:

- **The Gemini call happens on the server** (`app/api/generate/route.ts`),
  so the API key never reaches the browser.
- **Auth and search history are backed by Supabase** (Postgres + Auth), with
  row-level security enforcing that a user can only ever see their own data
  — see `supabase/schema.sql`.

## Quick start

1. **Gemini key**
   ```bash
   cp .env.example .env.local
   # set GEMINI_API_KEY=... in .env.local — get one free at
   # https://aistudio.google.com/apikey
   #
   # Note: this is a different credential from the Google OAuth Client
   # ID/Secret used for "Sign in with Google" (step 3 below) — that one
   # can't be used here, and vice versa.
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

4. **Rate limiting** (optional — works without it, see the status table below)
   - Create a free database at [console.upstash.com](https://console.upstash.com)
     (Redis → Create Database).
   - Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` from the
     database's REST API section into `.env.local`.
   - Skip this and the app still works — `/api/generate` falls back to a
     simple in-memory limiter (see `lib/rateLimit.ts`), which is fine for
     local dev and a single-instance deployment.

5. **Stripe** (optional until you want to charge — everything else works without it)
   - Follow the comments in `.env.example` to create two recurring Prices
     (Pro, Business), grab your secret key, and add a webhook endpoint at
     `/api/stripe/webhook`. Set `NEXT_PUBLIC_APP_URL`.
   - Use test mode and the Stripe CLI (`stripe listen --forward-to
     localhost:3000/api/stripe/webhook`) while developing.
   - Prices in `lib/plans.ts` are suggestions; edit them, then make the
     Stripe Prices match.

6. **Install and run**
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
| Generating explanations | **Real.** Calls Gemini via a server route, with schema-constrained JSON output. |
| API key handling | **Real.** Server-side only, never sent to the client. |
| Sign in | **Real.** Supabase Auth — passwordless magic link, or Google. No passwords stored anywhere. |
| User profile | **Real.** `profiles` table, one row per user, created automatically on signup. |
| History | **Real.** `history` table, row-level security scoped to `auth.uid()` — a user can only ever query their own rows, enforced by Postgres. |
| Delete account | **Real.** `app/api/account/delete/route.ts` deletes the `auth.users` row; `profiles` and `history` cascade-delete with it. |
| Share links | **Real.** `/share/[slug]` is a public, no-login page for a single history item a user has opted to share — enforced by a dedicated RLS policy (`share_slug is not null`), not by app code. |
| Per-IP rate limiting | **Real, when Upstash is configured.** Falls back to a single-instance in-memory limiter otherwise (see `lib/rateLimit.ts`) — the app works either way, but only the Upstash-backed version holds up across multiple serverless instances. |
| Subscriptions | **Real (needs your Stripe account).** Free / Pro / Business plans in `lib/plans.ts`; Stripe Checkout + Customer Portal; plan changes come from signed Stripe webhooks (`app/api/stripe/webhook`), never from the client. |
| Usage limits | **Real.** Each generation by a signed-in user is written to `usage_events` by the server; `/api/generate` enforces the plan's monthly cap (HTTP 402 when reached). Signed-out use is allowed and only IP rate-limited. |
| Public API | **Real.** `POST /api/v1/generate` with an `sk_chalk_…` key (Pro/Business only). Keys are stored as SHA-256 hashes; shown once at creation. |
| Limit-warning email | **Real if Resend is configured**, skipped silently otherwise. |
| Team / organization accounts | **Not built.** See "Next steps". |
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
  share/[slug]/page.tsx      public, no-login view of one shared history item
  share/[slug]/not-found.tsx  shown for an invalid/unshared slug
  api/
    generate/route.ts        server-side Gemini call
    account/delete/route.ts    deletes a user's account (service role)
    stripe/checkout|portal|webhook/route.ts   billing
    v1/generate/route.ts       public API, API-key auth
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

### 1. Team / organization accounts

Deliberately not built yet — it's a large, cross-cutting change rather than a
feature: an `organizations` + `memberships` model, invites, rewriting every RLS
policy so data can be scoped to an org as well as a user, and moving the Stripe
customer and plan from the user to the org. Worth doing once individual plans
are proven.

### 2. Production email — connect real SMTP

- Supabase's built-in email service is for development only: low rate
  limits, and mail often lands in spam since it's sent from a shared
  Supabase domain, not yours.
- In Supabase: Authentication → Emails → SMTP Settings, connect a real
  provider (Resend, Postmark, and AWS SES are common choices; Resend has
  the simplest setup and a usable free tier).
- While you're there, Authentication → Email Templates lets you replace
  the default magic-link email with branded copy.

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
VPS with `npm run build && npm start`). Set all the env vars from
`.env.example` on whatever platform you use — `GEMINI_API_KEY` and
`SUPABASE_SERVICE_ROLE_KEY` must stay server-side only, never committed and
never given a `NEXT_PUBLIC_` prefix.

Two things to do once you have a real domain:
- In Supabase, Authentication → URL Configuration: add
  `https://yourdomain.com/auth/callback` as a redirect URL (keep the
  localhost one too if you still develop locally).
- Set the Supabase project's "Site URL" to your production domain, so magic
  links point at the right place by default.
