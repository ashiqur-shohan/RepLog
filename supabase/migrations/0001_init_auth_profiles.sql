-- migration: 0001_init_auth_profiles
-- enums, helper functions, profiles, notification_prefs

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ============================================================================
-- enums
-- ============================================================================

do $$ begin
  create type weight_unit as enum ('kg', 'lb');
exception when duplicate_object then null; end $$;

do $$ begin
  create type exercise_difficulty as enum ('beginner', 'intermediate', 'advanced');
exception when duplicate_object then null; end $$;

do $$ begin
  create type muscle_role as enum ('primary', 'secondary');
exception when duplicate_object then null; end $$;

do $$ begin
  create type subscription_tier as enum ('free', 'pro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type subscription_status as enum ('active', 'trialing', 'past_due', 'canceled', 'paused');
exception when duplicate_object then null; end $$;

do $$ begin
  create type measurement_unit as enum ('kg', 'lb', 'cm', 'in', 'percent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type audit_action as enum ('insert', 'update', 'delete', 'login', 'subscribe', 'cancel', 'export');
exception when duplicate_object then null; end $$;

-- ============================================================================
-- helper functions
-- ============================================================================

-- generic trigger to maintain updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- admin role detector. checks both top-level jwt role claim and app_metadata.role
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() ->> 'role') = 'admin'
    or ((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin',
    false
  );
$$;

-- ============================================================================
-- profiles (1:1 with auth.users)
-- ============================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  weight_unit weight_unit not null default 'kg',
  timezone text not null default 'UTC',
  date_of_birth date,
  onboarded_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_len check (display_name is null or char_length(display_name) between 1 and 60)
);

create index if not exists profiles_active_idx on public.profiles (id) where deleted_at is null;

create trigger trg_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- auto-create profile row when a new auth.user appears
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  insert into public.notification_prefs (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

-- ============================================================================
-- notification_prefs
-- ============================================================================

create table if not exists public.notification_prefs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_workout_reminders boolean not null default true,
  email_weekly_digest boolean not null default true,
  email_marketing boolean not null default false,
  push_workout_reminders boolean not null default false,
  rest_timer_seconds int not null default 90 check (rest_timer_seconds between 0 and 600),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_updated_at
  before update on public.notification_prefs
  for each row execute function public.set_updated_at();

-- hook trigger on auth.users for profile/prefs bootstrap
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- RLS
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.notification_prefs enable row level security;

-- profiles: a user can see and edit their own row; admins can see all
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using ((id = auth.uid() and deleted_at is null) or public.is_admin());

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert with check (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- notification_prefs: owner-scoped
drop policy if exists notif_prefs_select on public.notification_prefs;
create policy notif_prefs_select on public.notification_prefs
  for select using ((user_id = auth.uid() and deleted_at is null) or public.is_admin());

drop policy if exists notif_prefs_insert on public.notification_prefs;
create policy notif_prefs_insert on public.notification_prefs
  for insert with check (user_id = auth.uid() or public.is_admin());

drop policy if exists notif_prefs_update on public.notification_prefs;
create policy notif_prefs_update on public.notification_prefs
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- ============================================================================
-- soft-delete purge (called from a Vercel cron route via service role)
-- ============================================================================

create or replace function public.purge_soft_deleted()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() and current_setting('request.jwt.claim.role', true) is distinct from 'service_role' then
    raise exception 'forbidden';
  end if;

  delete from public.profiles where deleted_at is not null and deleted_at < now() - interval '30 days';
  delete from public.notification_prefs where deleted_at is not null and deleted_at < now() - interval '30 days';

  -- exercises (custom user exercises only — globals never soft-deleted)
  delete from public.exercise_muscles em
   using public.exercises e
   where em.exercise_id = e.id
     and e.deleted_at is not null
     and e.deleted_at < now() - interval '30 days'
     and e.is_global = false;
  delete from public.exercises
   where deleted_at is not null
     and deleted_at < now() - interval '30 days'
     and is_global = false;

  -- plans (children cascade by fk on delete cascade after parent purge)
  delete from public.plan_day_exercises where deleted_at is not null and deleted_at < now() - interval '30 days';
  delete from public.plan_days where deleted_at is not null and deleted_at < now() - interval '30 days';
  delete from public.workout_plans where deleted_at is not null and deleted_at < now() - interval '30 days';

  -- sessions
  delete from public.session_sets where deleted_at is not null and deleted_at < now() - interval '30 days';
  delete from public.workout_sessions where deleted_at is not null and deleted_at < now() - interval '30 days';

  -- measurements
  delete from public.body_measurements where deleted_at is not null and deleted_at < now() - interval '30 days';
exception
  when undefined_table then
    -- swallow when called before later migrations land
    return;
end;
$$;
