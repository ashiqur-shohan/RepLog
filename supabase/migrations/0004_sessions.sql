-- migration: 0004_sessions
-- workout_sessions, session_sets, personal_records, body_measurements,
-- PR trigger, RPC functions, v_user_dashboard

-- ============================================================================
-- workout_sessions
-- ============================================================================

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_day_id uuid references public.plan_days(id) on delete set null,
  name text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sessions_finished_after_started_ck check (
    finished_at is null or finished_at >= started_at
  )
);

create trigger trg_updated_at
  before update on public.workout_sessions
  for each row execute function public.set_updated_at();

-- hot path: user history listing (newest-first)
create index if not exists workout_sessions_user_started_idx
  on public.workout_sessions (user_id, started_at desc) where deleted_at is null;

-- index fk for joins from plan_days
create index if not exists workout_sessions_plan_day_idx
  on public.workout_sessions (plan_day_id) where deleted_at is null;

-- ============================================================================
-- session_sets
-- ============================================================================

create table if not exists public.session_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  set_number int not null check (set_number between 1 and 50),
  -- weight stored canonically in kg; display unit comes from profiles.weight_unit
  weight_kg numeric(6,2) not null default 0 check (weight_kg >= 0 and weight_kg <= 1000),
  reps int not null check (reps between 0 and 200),
  -- RPE 1..10 in 0.5 steps
  rpe numeric(3,1) check (rpe between 1.0 and 10.0 and (rpe * 2) = floor(rpe * 2)),
  is_warmup boolean not null default false,
  completed_at timestamptz,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_updated_at
  before update on public.session_sets
  for each row execute function public.set_updated_at();

-- hot path: render a session in set order, group by exercise
create index if not exists session_sets_session_exercise_idx
  on public.session_sets (session_id, exercise_id, set_number);

-- progress-chart path: history of a single exercise for a user
create index if not exists session_sets_exercise_idx
  on public.session_sets (exercise_id) where deleted_at is null;

create unique index if not exists session_sets_session_exercise_setnum_uq
  on public.session_sets (session_id, exercise_id, set_number) where deleted_at is null;

-- ============================================================================
-- personal_records (denormalized for fast PR reads)
-- ============================================================================

create table if not exists public.personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  best_weight_kg numeric(6,2) not null,
  best_reps int not null,
  best_volume numeric(10,2) generated always as (best_weight_kg * best_reps) stored,
  achieved_at timestamptz not null default now(),
  session_set_id uuid references public.session_sets(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, exercise_id)
);

create trigger trg_updated_at
  before update on public.personal_records
  for each row execute function public.set_updated_at();

-- index user dashboard "recent PRs" listing
create index if not exists personal_records_user_idx
  on public.personal_records (user_id, achieved_at desc);

-- ============================================================================
-- body_measurements (bodyweight / body fat / waist time series)
-- ============================================================================

create table if not exists public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  metric text not null check (metric in ('bodyweight', 'body_fat', 'waist', 'chest', 'arm', 'thigh', 'hip')),
  value numeric(8,2) not null check (value >= 0 and value <= 10000),
  unit measurement_unit not null,
  measured_at timestamptz not null default now(),
  note text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_updated_at
  before update on public.body_measurements
  for each row execute function public.set_updated_at();

create index if not exists body_measurements_user_metric_idx
  on public.body_measurements (user_id, metric, measured_at desc) where deleted_at is null;

-- ============================================================================
-- PR trigger: on session_sets INSERT, compare weight*reps to stored best_volume
-- ============================================================================

create or replace function public.update_personal_record()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_new_volume numeric(10,2);
  v_existing_volume numeric(10,2);
begin
  -- skip warmups and zero-weight/zero-rep working sets
  if new.is_warmup or new.weight_kg = 0 or new.reps = 0 then
    return new;
  end if;

  select user_id into v_user_id from public.workout_sessions where id = new.session_id;
  if v_user_id is null then
    return new;
  end if;

  v_new_volume := new.weight_kg * new.reps;

  select best_volume into v_existing_volume
    from public.personal_records
   where user_id = v_user_id and exercise_id = new.exercise_id;

  if v_existing_volume is null then
    -- first record for this user x exercise
    insert into public.personal_records (
      user_id, exercise_id, best_weight_kg, best_reps, achieved_at, session_set_id
    ) values (
      v_user_id, new.exercise_id, new.weight_kg, new.reps, coalesce(new.completed_at, now()), new.id
    )
    on conflict (user_id, exercise_id) do nothing;
  elsif v_new_volume > v_existing_volume then
    update public.personal_records
       set best_weight_kg = new.weight_kg,
           best_reps = new.reps,
           achieved_at = coalesce(new.completed_at, now()),
           session_set_id = new.id,
           updated_at = now()
     where user_id = v_user_id and exercise_id = new.exercise_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_update_pr on public.session_sets;
create trigger trg_update_pr
  after insert on public.session_sets
  for each row execute function public.update_personal_record();

-- ============================================================================
-- RLS
-- ============================================================================

alter table public.workout_sessions enable row level security;
alter table public.session_sets enable row level security;
alter table public.personal_records enable row level security;
alter table public.body_measurements enable row level security;

-- workout_sessions: direct owner scoping
drop policy if exists ws_select on public.workout_sessions;
create policy ws_select on public.workout_sessions
  for select using ((user_id = auth.uid() and deleted_at is null) or public.is_admin());

drop policy if exists ws_insert on public.workout_sessions;
create policy ws_insert on public.workout_sessions
  for insert with check (user_id = auth.uid());

drop policy if exists ws_update on public.workout_sessions;
create policy ws_update on public.workout_sessions
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- session_sets: indirect ownership via workout_sessions
drop policy if exists ss_select on public.session_sets;
create policy ss_select on public.session_sets
  for select using (
    deleted_at is null
    and (
      exists (
        select 1 from public.workout_sessions s
         where s.id = session_sets.session_id
           and s.user_id = auth.uid()
           and s.deleted_at is null
      )
      or public.is_admin()
    )
  );

drop policy if exists ss_insert on public.session_sets;
create policy ss_insert on public.session_sets
  for insert with check (
    exists (
      select 1 from public.workout_sessions s
       where s.id = session_sets.session_id
         and s.user_id = auth.uid()
         and s.deleted_at is null
    )
  );

drop policy if exists ss_update on public.session_sets;
create policy ss_update on public.session_sets
  for update using (
    exists (
      select 1 from public.workout_sessions s
       where s.id = session_sets.session_id
         and (s.user_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.workout_sessions s
       where s.id = session_sets.session_id
         and (s.user_id = auth.uid() or public.is_admin())
    )
  );

-- personal_records: read by owner; writes happen via SECURITY DEFINER trigger
drop policy if exists pr_select on public.personal_records;
create policy pr_select on public.personal_records
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists pr_admin_write on public.personal_records;
create policy pr_admin_write on public.personal_records
  for all using (public.is_admin()) with check (public.is_admin());

-- body_measurements: owner-scoped
drop policy if exists bm_select on public.body_measurements;
create policy bm_select on public.body_measurements
  for select using ((user_id = auth.uid() and deleted_at is null) or public.is_admin());

drop policy if exists bm_insert on public.body_measurements;
create policy bm_insert on public.body_measurements
  for insert with check (user_id = auth.uid());

drop policy if exists bm_update on public.body_measurements;
create policy bm_update on public.body_measurements
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- ============================================================================
-- RPC functions
-- ============================================================================

-- current streak: consecutive days with at least one session, anchored at today or yesterday
create or replace function public.current_streak(p_user_id uuid)
returns int
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_streak int := 0;
  v_cursor date;
  v_today date := (now() at time zone 'UTC')::date;
  v_has_today boolean;
  v_has_yesterday boolean;
begin
  if p_user_id is distinct from auth.uid() and not public.is_admin() then
    raise exception 'forbidden';
  end if;

  select exists (
    select 1 from public.workout_sessions
     where user_id = p_user_id
       and deleted_at is null
       and (started_at at time zone 'UTC')::date = v_today
  ) into v_has_today;

  select exists (
    select 1 from public.workout_sessions
     where user_id = p_user_id
       and deleted_at is null
       and (started_at at time zone 'UTC')::date = v_today - 1
  ) into v_has_yesterday;

  if v_has_today then
    v_cursor := v_today;
  elsif v_has_yesterday then
    v_cursor := v_today - 1;
  else
    return 0;
  end if;

  loop
    if exists (
      select 1 from public.workout_sessions
       where user_id = p_user_id
         and deleted_at is null
         and (started_at at time zone 'UTC')::date = v_cursor
    ) then
      v_streak := v_streak + 1;
      v_cursor := v_cursor - 1;
    else
      exit;
    end if;
  end loop;

  return v_streak;
end;
$$;

-- personal_record_for: return PR row for a (user, exercise)
create or replace function public.personal_record_for(p_user_id uuid, p_exercise_id uuid)
returns table (
  best_weight_kg numeric,
  best_reps int,
  best_volume numeric,
  achieved_at timestamptz
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if p_user_id is distinct from auth.uid() and not public.is_admin() then
    raise exception 'forbidden';
  end if;

  return query
    select pr.best_weight_kg, pr.best_reps, pr.best_volume, pr.achieved_at
      from public.personal_records pr
     where pr.user_id = p_user_id
       and pr.exercise_id = p_exercise_id;
end;
$$;

-- weekly_volume: SUM(weight*reps) per primary muscle group for a given week
create or replace function public.weekly_volume(p_user_id uuid, p_week_start date)
returns table (
  muscle_group_id uuid,
  muscle_slug text,
  muscle_name text,
  volume numeric
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if p_user_id is distinct from auth.uid() and not public.is_admin() then
    raise exception 'forbidden';
  end if;

  return query
    select mg.id,
           mg.slug,
           mg.name,
           sum(ss.weight_kg * ss.reps)::numeric as volume
      from public.session_sets ss
      join public.workout_sessions s on s.id = ss.session_id
      join public.exercise_muscles em on em.exercise_id = ss.exercise_id and em.role = 'primary'
      join public.muscle_groups mg on mg.id = em.muscle_group_id
     where s.user_id = p_user_id
       and s.deleted_at is null
       and ss.deleted_at is null
       and ss.is_warmup = false
       and (s.started_at at time zone 'UTC')::date >= p_week_start
       and (s.started_at at time zone 'UTC')::date < (p_week_start + 7)
     group by mg.id, mg.slug, mg.name
     order by volume desc nulls last;
end;
$$;

-- (v_user_dashboard view moved to 0005_billing.sql so it can reference the
--  subscriptions table created there.)
