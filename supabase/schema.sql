-- Chalk database schema.
--
-- Run this once in your Supabase project: Dashboard → SQL Editor → paste
-- this whole file → Run. It creates two tables and locks them down with
-- row-level security so a user can only ever read or write their own rows
-- — that's enforced by Postgres itself, not by app code, so it holds even
-- if there's a bug in the Next.js app.

-- ---------------------------------------------------------------------
-- profiles: one row per signed-in user, extending Supabase's built-in
-- auth.users table with the display name we collect at sign-in.
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now()
);

-- Safe to re-run: adds the column if you ran an earlier version of this
-- schema before avatar_url existed. No-op on a fresh database.
alter table public.profiles add column if not exists avatar_url text;

-- Billing fields. `plan` is the source of truth the app checks before
-- gating generation; the Stripe IDs let the webhook (app/api/stripe/webhook)
-- find the right row when Stripe notifies us of a change.
alter table public.profiles add column if not exists plan text not null default 'free';
alter table public.profiles add column if not exists stripe_customer_id text unique;
alter table public.profiles add column if not exists stripe_subscription_id text;
alter table public.profiles add column if not exists subscription_status text;
-- Set when a free-tier limit-warning email has been sent for the current
-- calendar month, so /api/generate can avoid sending it more than once.
alter table public.profiles add column if not exists limit_warning_sent_for text;

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Automatically create a profile row whenever a new user signs up, whether
-- that's via magic link (full_name comes from the metadata we pass to
-- supabase.auth.signInWithOtp) or Google OAuth (full_name and avatar_url
-- come from Google's profile data automatically — different providers use
-- slightly different key names, hence the coalesce fallbacks below).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- history: one row per generated explanation.
-- ---------------------------------------------------------------------
create table if not exists public.history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  input_preview text not null,
  title text not null,
  concepts jsonb not null,
  created_at timestamptz not null default now()
);

-- Safe to re-run: adds the column if you ran an earlier version of this
-- schema before share links existed. Null = not shared (the default for
-- every existing row). A non-null value is a short public token used in
-- /share/[slug] URLs — anyone with the link can view that one row, nothing
-- else.
alter table public.history add column if not exists share_slug text unique;

create index if not exists history_user_id_created_at_idx
  on public.history (user_id, created_at desc);

create index if not exists history_share_slug_idx
  on public.history (share_slug) where share_slug is not null;

alter table public.history enable row level security;

create policy "Users can view their own history"
  on public.history for select
  using (auth.uid() = user_id);

-- Separate from the policy above: this is what makes /share/[slug] work
-- for signed-out visitors. RLS policies are OR'd together, so a row is
-- readable if it matches *either* policy — the owner can always read their
-- own rows, and anyone (including anonymous visitors) can read a row that
-- has been explicitly shared. Rows with share_slug still null stay fully
-- private.
create policy "Anyone can view shared history"
  on public.history for select
  using (share_slug is not null);

create policy "Users can insert their own history"
  on public.history for insert
  with check (auth.uid() = user_id);

-- Needed so a user can set/clear share_slug on their own rows (toggling
-- share on and off). Scoped to their own rows only, same as the other
-- policies.
create policy "Users can update their own history"
  on public.history for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own history"
  on public.history for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- usage_events: one row per generation attempt by a signed-in user. This
-- is the real, durable source of truth for billing and the profile usage
-- chart — it replaces the old purely-in-memory session counter, which
-- still exists in the UI for instant feedback but no longer decides
-- anything that matters across a refresh or a billing cycle.
--
-- Anonymous (signed-out) use is intentionally NOT tracked here — there's
-- no user_id to attach it to, and it isn't gated by a paid plan anyway.
-- ---------------------------------------------------------------------
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  char_count integer not null,
  billable boolean not null default true, -- false for the free-tier allotment
  created_at timestamptz not null default now()
);

create index if not exists usage_events_user_id_created_at_idx
  on public.usage_events (user_id, created_at desc);

alter table public.usage_events enable row level security;

create policy "Users can view their own usage"
  on public.usage_events for select
  using (auth.uid() = user_id);

-- No insert/update/delete policies for regular users on purpose: usage
-- events are written by the server using the service-role key (see
-- app/api/generate/route.ts), never directly by the client. This prevents
-- a user from editing their own usage history to dodge billing.

-- ---------------------------------------------------------------------
-- api_keys: lets a user call POST /api/v1/generate programmatically
-- instead of only through the web UI. Keys are stored hashed (sha256),
-- never in plaintext — the same approach used for passwords, since a
-- leaked database shouldn't hand out usable credentials.
-- ---------------------------------------------------------------------
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'Default key',
  key_hash text not null unique,
  key_prefix text not null, -- first few chars, shown in the UI so a user can tell keys apart without re-exposing the full key
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index if not exists api_keys_key_hash_idx on public.api_keys (key_hash);
create index if not exists api_keys_user_id_idx on public.api_keys (user_id);

alter table public.api_keys enable row level security;

create policy "Users can view their own API keys"
  on public.api_keys for select
  using (auth.uid() = user_id);

create policy "Users can create their own API keys"
  on public.api_keys for insert
  with check (auth.uid() = user_id);

create policy "Users can revoke their own API keys"
  on public.api_keys for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own API keys"
  on public.api_keys for delete
  using (auth.uid() = user_id);
