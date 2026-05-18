-- migration: 0006_profile_extras
-- Adds optional profile columns referenced by onboarding + profile editor:
-- goal, experience, height_cm, gender. All nullable, no data loss on existing rows.

alter table public.profiles
  add column if not exists goal text
    check (goal is null or goal in ('build_muscle','get_stronger','stay_consistent','lose_weight')),
  add column if not exists experience text
    check (experience is null or experience in ('beginner','intermediate','advanced')),
  add column if not exists height_cm int
    check (height_cm is null or (height_cm > 0 and height_cm <= 300)),
  add column if not exists gender text
    check (gender is null or gender in ('male','female','other','prefer_not_to_say'));
