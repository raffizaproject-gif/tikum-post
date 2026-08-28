-- =========================================================
-- TIKUM gallery — Supabase schema
-- Run this once in the Supabase SQL editor (or `supabase db push`).
--
-- Prerequisite (do this FIRST, in the Supabase dashboard):
--   Authentication → Sign In / Providers → Third Party Auth
--   → Add provider → Firebase → paste your Firebase Project ID.
-- That's what makes auth.jwt()->>'sub' below equal to the signed-in
-- user's Firebase UID — no Supabase Auth, no second login, Firebase
-- stays the only login system.
-- =========================================================

-- ---------------------------------------------------------
-- profiles
-- id = Firebase Auth UID (not a Supabase auth.users FK, since we don't
-- use Supabase Auth at all).
-- ---------------------------------------------------------
create table if not exists profiles (
  id text primary key,
  username text unique not null,
  full_name text not null,
  email text not null,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- photos
-- ---------------------------------------------------------
create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  image_url text not null,
  storage_path text not null,
  category text,
  location text,
  is_public boolean not null default true,
  owner_username text,
  owner_avatar text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists photos_public_created_idx on photos (is_public, created_at desc);
create index if not exists photos_user_idx on photos (user_id);
create index if not exists photos_category_idx on photos (category);

-- ---------------------------------------------------------
-- settings — single row, id fixed to 1
-- ---------------------------------------------------------
create table if not exists settings (
  id int primary key default 1 check (id = 1),
  site_name text not null default 'TIKUM',
  logo_text text not null default 'TIKUM',
  location text not null default '',
  hero_title text not null default '',
  hero_description text not null default '',
  about_text text not null default '',
  contact_email text not null default '',
  instagram text,
  footer_text text not null default '',
  updated_at timestamptz not null default now()
);

insert into settings (id) values (1) on conflict (id) do nothing;

-- =========================================================
-- Row Level Security
-- =========================================================
alter table profiles enable row level security;
alter table photos enable row level security;
alter table settings enable row level security;

-- helper: is the caller (by Firebase UID in the JWT) an admin?
create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = (select auth.jwt()->>'sub')
      and role = 'admin'
  );
$$;

-- profiles: public read (gallery shows "uploaded by @username")
create policy "profiles_public_read" on profiles
  for select using (true);

-- profiles: a user creates only their OWN row, and only as role='user' —
-- this is what stops the client from ever granting itself admin, same
-- guarantee the old handle_new_user() trigger gave.
create policy "profiles_self_insert" on profiles
  for insert with check (
    id = (select auth.jwt()->>'sub') and role = 'user'
  );

-- profiles: a user updates their own row but can't change their own role;
-- an admin can update anyone's row (e.g. to change role or is_active).
create policy "profiles_self_update" on profiles
  for update using (
    id = (select auth.jwt()->>'sub') or is_admin()
  ) with check (
    (id = (select auth.jwt()->>'sub') and role = (select role from profiles where id = (select auth.jwt()->>'sub')))
    or is_admin()
  );

create policy "profiles_admin_delete" on profiles
  for delete using (is_admin());

-- photos: public rows readable by anyone; private rows by owner or admin
create policy "photos_read" on photos
  for select using (
    is_public = true
    or user_id = (select auth.jwt()->>'sub')
    or is_admin()
  );

create policy "photos_insert_own" on photos
  for insert with check (user_id = (select auth.jwt()->>'sub'));

create policy "photos_update_own_or_admin" on photos
  for update using (user_id = (select auth.jwt()->>'sub') or is_admin());

create policy "photos_delete_own_or_admin" on photos
  for delete using (user_id = (select auth.jwt()->>'sub') or is_admin());

-- settings: public read, admin-only write
create policy "settings_public_read" on settings
  for select using (true);

create policy "settings_admin_write" on settings
  for update using (is_admin());

-- =========================================================
-- Storage: bucket for photo files
-- Path convention: photos/<firebase_uid>/<uuid>.<ext>
-- =========================================================
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "photos_bucket_public_read" on storage.objects
  for select using (bucket_id = 'photos');

create policy "photos_bucket_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
  );

create policy "photos_bucket_owner_or_admin_delete" on storage.objects
  for delete using (
    bucket_id = 'photos'
    and (
      (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
      or is_admin()
    )
  );
