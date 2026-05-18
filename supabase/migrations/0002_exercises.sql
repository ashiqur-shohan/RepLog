-- migration: 0002_exercises
-- muscle groups, equipment, exercises, exercise_muscles, storage buckets

-- ============================================================================
-- muscle_groups
-- ============================================================================

create table if not exists public.muscle_groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_updated_at
  before update on public.muscle_groups
  for each row execute function public.set_updated_at();

-- ============================================================================
-- equipment
-- ============================================================================

create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_updated_at
  before update on public.equipment
  for each row execute function public.set_updated_at();

-- ============================================================================
-- exercises
-- ============================================================================

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  instructions text,
  difficulty exercise_difficulty not null default 'beginner',
  equipment_id uuid references public.equipment(id) on delete set null,
  -- media columns (admin-curated content stored in exercise-media bucket)
  media_url text,
  media_type text check (media_type in ('gif', 'mp4', 'webm')),
  thumbnail_url text,
  media_attribution text,
  is_global boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- a custom exercise must have a creator; a global one must not
  constraint exercises_ownership_ck check (
    (is_global = true and created_by is null)
    or (is_global = false and created_by is not null)
  )
);

create trigger trg_updated_at
  before update on public.exercises
  for each row execute function public.set_updated_at();

-- index foreign keys (filter by equipment in UI)
create index if not exists exercises_equipment_idx
  on public.exercises (equipment_id) where deleted_at is null;

-- index for "my custom exercises" lookups
create index if not exists exercises_created_by_idx
  on public.exercises (created_by) where deleted_at is null and is_global = false;

-- full-text search index for exercise picker
create index if not exists exercises_name_tsv_idx
  on public.exercises using gin (to_tsvector('english', name));

-- ============================================================================
-- exercise_muscles (M:N exercise<->muscle_group with primary/secondary role)
-- ============================================================================

create table if not exists public.exercise_muscles (
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  muscle_group_id uuid not null references public.muscle_groups(id) on delete restrict,
  role muscle_role not null,
  created_at timestamptz not null default now(),
  primary key (exercise_id, muscle_group_id)
);

-- index reverse lookup: "give me all exercises that hit chest as primary"
create index if not exists exercise_muscles_muscle_role_idx
  on public.exercise_muscles (muscle_group_id, role);

-- ============================================================================
-- RLS
-- ============================================================================

alter table public.muscle_groups enable row level security;
alter table public.equipment enable row level security;
alter table public.exercises enable row level security;
alter table public.exercise_muscles enable row level security;

-- muscle_groups: public read, admin write
drop policy if exists mg_select on public.muscle_groups;
create policy mg_select on public.muscle_groups for select using (true);

drop policy if exists mg_write on public.muscle_groups;
create policy mg_write on public.muscle_groups
  for all using (public.is_admin()) with check (public.is_admin());

-- equipment: public read, admin write
drop policy if exists eq_select on public.equipment;
create policy eq_select on public.equipment for select using (true);

drop policy if exists eq_write on public.equipment;
create policy eq_write on public.equipment
  for all using (public.is_admin()) with check (public.is_admin());

-- exercises: anyone can read globals + their own customs; admins can write globals;
-- pro users (enforced at app layer) write their own customs
drop policy if exists ex_select on public.exercises;
create policy ex_select on public.exercises
  for select using (
    (is_global = true and deleted_at is null)
    or (created_by = auth.uid() and deleted_at is null)
    or public.is_admin()
  );

drop policy if exists ex_insert on public.exercises;
create policy ex_insert on public.exercises
  for insert with check (
    (is_global = false and created_by = auth.uid())
    or public.is_admin()
  );

drop policy if exists ex_update on public.exercises;
create policy ex_update on public.exercises
  for update using (
    (is_global = false and created_by = auth.uid())
    or public.is_admin()
  )
  with check (
    (is_global = false and created_by = auth.uid())
    or public.is_admin()
  );

-- exercise_muscles: read mirrors parent visibility; writes follow parent ownership.
-- using EXISTS subquery to traverse parent ownership (indirect ownership pattern)
drop policy if exists em_select on public.exercise_muscles;
create policy em_select on public.exercise_muscles
  for select using (
    exists (
      select 1 from public.exercises e
       where e.id = exercise_muscles.exercise_id
         and (
           (e.is_global = true and e.deleted_at is null)
           or (e.created_by = auth.uid() and e.deleted_at is null)
           or public.is_admin()
         )
    )
  );

drop policy if exists em_write on public.exercise_muscles;
create policy em_write on public.exercise_muscles
  for all using (
    exists (
      select 1 from public.exercises e
       where e.id = exercise_muscles.exercise_id
         and ((e.is_global = false and e.created_by = auth.uid()) or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.exercises e
       where e.id = exercise_muscles.exercise_id
         and ((e.is_global = false and e.created_by = auth.uid()) or public.is_admin())
    )
  );

-- ============================================================================
-- storage buckets
-- ============================================================================

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('progress-photos', 'progress-photos', false),
  ('exercise-media', 'exercise-media', true)
on conflict (id) do nothing;

-- avatars: public read; users write under their own uid folder
drop policy if exists avatars_public_read on storage.objects;
create policy avatars_public_read on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists avatars_owner_write on storage.objects;
create policy avatars_owner_write on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatars_owner_update on storage.objects;
create policy avatars_owner_update on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatars_owner_delete on storage.objects;
create policy avatars_owner_delete on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- progress-photos: owner read/write only, no public
drop policy if exists progress_photos_owner_select on storage.objects;
create policy progress_photos_owner_select on storage.objects
  for select using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists progress_photos_owner_insert on storage.objects;
create policy progress_photos_owner_insert on storage.objects
  for insert with check (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists progress_photos_owner_update on storage.objects;
create policy progress_photos_owner_update on storage.objects
  for update using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists progress_photos_owner_delete on storage.objects;
create policy progress_photos_owner_delete on storage.objects
  for delete using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- exercise-media: public read; admin write only
drop policy if exists exercise_media_public_read on storage.objects;
create policy exercise_media_public_read on storage.objects
  for select using (bucket_id = 'exercise-media');

drop policy if exists exercise_media_admin_insert on storage.objects;
create policy exercise_media_admin_insert on storage.objects
  for insert with check (bucket_id = 'exercise-media' and public.is_admin());

drop policy if exists exercise_media_admin_update on storage.objects;
create policy exercise_media_admin_update on storage.objects
  for update using (bucket_id = 'exercise-media' and public.is_admin());

drop policy if exists exercise_media_admin_delete on storage.objects;
create policy exercise_media_admin_delete on storage.objects
  for delete using (bucket_id = 'exercise-media' and public.is_admin());
