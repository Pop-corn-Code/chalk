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

create index if not exists history_user_id_created_at_idx
  on public.history (user_id, created_at desc);

alter table public.history enable row level security;

create policy "Users can view their own history"
  on public.history for select
  using (auth.uid() = user_id);

create policy "Users can insert their own history"
  on public.history for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own history"
  on public.history for delete
  using (auth.uid() = user_id);
