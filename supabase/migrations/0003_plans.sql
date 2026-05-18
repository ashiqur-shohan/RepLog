-- migration: 0003_plans
-- workout_plans -> plan_days -> plan_day_exercises, soft-delete cascade

-- ============================================================================
-- workout_plans
-- ============================================================================

create table if not exists public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  description text,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_updated_at
  before update on public.workout_plans
  for each row execute function public.set_updated_at();

-- index user lookups + active-only listings
create index if not exists workout_plans_user_idx
  on public.workout_plans (user_id, created_at desc) where deleted_at is null;

-- partial unique index: a user can have only one plan with a given name (case-insensitive),
-- excluding soft-deleted rows
create unique index if not exists workout_plans_user_name_uq
  on public.workout_plans (user_id, lower(name)) where deleted_at is null;

-- ============================================================================
-- plan_days (ordered days within a plan, e.g. day 1 push / day 2 pull)
-- ============================================================================

create table if not exists public.plan_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.workout_plans(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  position int not null check (position >= 0),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_updated_at
  before update on public.plan_days
  for each row execute function public.set_updated_at();

-- index fk + position for ordered fetch
create index if not exists plan_days_plan_idx
  on public.plan_days (plan_id, position) where deleted_at is null;

-- one slot per position per plan (active rows only)
create unique index if not exists plan_days_plan_position_uq
  on public.plan_days (plan_id, position) where deleted_at is null;

-- ============================================================================
-- plan_day_exercises (an exercise slotted into a plan day)
-- ============================================================================

create table if not exists public.plan_day_exercises (
  id uuid primary key default gen_random_uuid(),
  plan_day_id uuid not null references public.plan_days(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  position int not null check (position >= 0),
  target_sets int check (target_sets between 1 and 20),
  target_reps_min int check (target_reps_min between 1 and 100),
  target_reps_max int check (target_reps_max between 1 and 100),
  target_rpe numeric(3,1) check (target_rpe between 1.0 and 10.0),
  rest_seconds int check (rest_seconds between 0 and 1800),
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pde_reps_range_ck check (
    target_reps_min is null or target_reps_max is null or target_reps_min <= target_reps_max
  )
);

create trigger trg_updated_at
  before update on public.plan_day_exercises
  for each row execute function public.set_updated_at();

create index if not exists pde_day_idx
  on public.plan_day_exercises (plan_day_id, position) where deleted_at is null;

create index if not exists pde_exercise_idx
  on public.plan_day_exercises (exercise_id) where deleted_at is null;

create unique index if not exists pde_day_position_uq
  on public.plan_day_exercises (plan_day_id, position) where deleted_at is null;

-- ============================================================================
-- soft-delete cascade triggers (plan -> days -> exercises)
-- ============================================================================

create or replace function public.cascade_soft_delete_plan()
returns trigger
language plpgsql
as $$
begin
  if new.deleted_at is not null and old.deleted_at is null then
    update public.plan_days
       set deleted_at = new.deleted_at
     where plan_id = new.id and deleted_at is null;
  end if;
  return new;
end;
$$;

create or replace function public.cascade_soft_delete_plan_day()
returns trigger
language plpgsql
as $$
begin
  if new.deleted_at is not null and old.deleted_at is null then
    update public.plan_day_exercises
       set deleted_at = new.deleted_at
     where plan_day_id = new.id and deleted_at is null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_cascade_soft_delete_plan on public.workout_plans;
create trigger trg_cascade_soft_delete_plan
  after update of deleted_at on public.workout_plans
  for each row execute function public.cascade_soft_delete_plan();

drop trigger if exists trg_cascade_soft_delete_plan_day on public.plan_days;
create trigger trg_cascade_soft_delete_plan_day
  after update of deleted_at on public.plan_days
  for each row execute function public.cascade_soft_delete_plan_day();

-- ============================================================================
-- RLS
-- ============================================================================

alter table public.workout_plans enable row level security;
alter table public.plan_days enable row level security;
alter table public.plan_day_exercises enable row level security;

-- workout_plans: direct owner scoping
drop policy if exists wp_select on public.workout_plans;
create policy wp_select on public.workout_plans
  for select using ((user_id = auth.uid() and deleted_at is null) or public.is_admin());

drop policy if exists wp_insert on public.workout_plans;
create policy wp_insert on public.workout_plans
  for insert with check (user_id = auth.uid());

drop policy if exists wp_update on public.workout_plans;
create policy wp_update on public.workout_plans
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- plan_days: indirect ownership through workout_plans
-- using EXISTS subquery rather than denormalizing user_id keeps the source of truth
-- on the parent and lets fk cascades stay simple.
drop policy if exists pd_select on public.plan_days;
create policy pd_select on public.plan_days
  for select using (
    deleted_at is null
    and (
      exists (
        select 1 from public.workout_plans p
         where p.id = plan_days.plan_id
           and p.user_id = auth.uid()
           and p.deleted_at is null
      )
      or public.is_admin()
    )
  );

drop policy if exists pd_insert on public.plan_days;
create policy pd_insert on public.plan_days
  for insert with check (
    exists (
      select 1 from public.workout_plans p
       where p.id = plan_days.plan_id
         and p.user_id = auth.uid()
         and p.deleted_at is null
    )
  );

drop policy if exists pd_update on public.plan_days;
create policy pd_update on public.plan_days
  for update using (
    exists (
      select 1 from public.workout_plans p
       where p.id = plan_days.plan_id
         and (p.user_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.workout_plans p
       where p.id = plan_days.plan_id
         and (p.user_id = auth.uid() or public.is_admin())
    )
  );

-- plan_day_exercises: two-hop ownership (day -> plan -> user)
drop policy if exists pde_select on public.plan_day_exercises;
create policy pde_select on public.plan_day_exercises
  for select using (
    deleted_at is null
    and (
      exists (
        select 1
          from public.plan_days d
          join public.workout_plans p on p.id = d.plan_id
         where d.id = plan_day_exercises.plan_day_id
           and p.user_id = auth.uid()
           and p.deleted_at is null
           and d.deleted_at is null
      )
      or public.is_admin()
    )
  );

drop policy if exists pde_insert on public.plan_day_exercises;
create policy pde_insert on public.plan_day_exercises
  for insert with check (
    exists (
      select 1
        from public.plan_days d
        join public.workout_plans p on p.id = d.plan_id
       where d.id = plan_day_exercises.plan_day_id
         and p.user_id = auth.uid()
    )
  );

drop policy if exists pde_update on public.plan_day_exercises;
create policy pde_update on public.plan_day_exercises
  for update using (
    exists (
      select 1
        from public.plan_days d
        join public.workout_plans p on p.id = d.plan_id
       where d.id = plan_day_exercises.plan_day_id
         and (p.user_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1
        from public.plan_days d
        join public.workout_plans p on p.id = d.plan_id
       where d.id = plan_day_exercises.plan_day_id
         and (p.user_id = auth.uid() or public.is_admin())
    )
  );
