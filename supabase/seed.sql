-- seed: muscle_groups, equipment, exercises, exercise_muscles
-- idempotent: uses ON CONFLICT DO NOTHING so re-runs are safe

-- ============================================================================
-- muscle_groups (8 rows)
-- ============================================================================

insert into public.muscle_groups (slug, name, display_order) values
  ('chest',                   'Chest',                  10),
  ('back',                    'Back',                   20),
  ('shoulders',               'Shoulders',              30),
  ('biceps',                  'Biceps',                 40),
  ('triceps',                 'Triceps',                50),
  ('core',                    'Core',                   60),
  ('quadriceps',              'Quadriceps',             70),
  ('hamstrings-and-glutes',   'Hamstrings & Glutes',    80)
on conflict (slug) do nothing;

-- ============================================================================
-- equipment (15 rows)
-- ============================================================================

insert into public.equipment (slug, name, display_order) values
  ('bodyweight',      'Bodyweight',       10),
  ('barbell',         'Barbell',          20),
  ('dumbbell',        'Dumbbell',         30),
  ('kettlebell',      'Kettlebell',       40),
  ('cable',           'Cable',            50),
  ('machine',         'Machine',          60),
  ('smith-machine',   'Smith Machine',    70),
  ('pull-up-bar',     'Pull-Up Bar',      80),
  ('dip-bar',         'Dip Bar',          90),
  ('bench',           'Bench',            100),
  ('resistance-band', 'Resistance Band',  110),
  ('medicine-ball',   'Medicine Ball',    120),
  ('ez-bar',          'EZ Bar',           130),
  ('trx',             'TRX / Suspension', 140),
  ('box',             'Plyo Box',         150)
on conflict (slug) do nothing;

-- ============================================================================
-- exercises (30 rows) — all globals, no created_by
-- ============================================================================

insert into public.exercises (slug, name, description, difficulty, equipment_id, is_global) values
  -- chest
  ('bench-press',           'Barbell Bench Press',        'Flat barbell press from the chest.',                         'intermediate', (select id from public.equipment where slug = 'barbell'),         true),
  ('incline-dumbbell-press','Incline Dumbbell Press',     'Upper-chest focused press on a 30-45 degree incline bench.', 'intermediate', (select id from public.equipment where slug = 'dumbbell'),        true),
  ('push-up',               'Push-Up',                    'Bodyweight horizontal press.',                                'beginner',     (select id from public.equipment where slug = 'bodyweight'),      true),
  ('dumbbell-fly',          'Dumbbell Fly',               'Flat-bench isolation movement for the chest.',                'beginner',     (select id from public.equipment where slug = 'dumbbell'),        true),
  -- back
  ('pull-up',               'Pull-Up',                    'Pronated-grip bodyweight vertical pull.',                     'intermediate', (select id from public.equipment where slug = 'pull-up-bar'),    true),
  ('chin-up',               'Chin-Up',                    'Supinated-grip bodyweight vertical pull.',                    'intermediate', (select id from public.equipment where slug = 'pull-up-bar'),    true),
  ('barbell-row',           'Barbell Bent-Over Row',      'Hip-hinge horizontal pull with a barbell.',                   'intermediate', (select id from public.equipment where slug = 'barbell'),         true),
  ('lat-pulldown',          'Lat Pulldown',               'Seated cable vertical pull.',                                  'beginner',     (select id from public.equipment where slug = 'cable'),           true),
  ('seated-cable-row',      'Seated Cable Row',           'Seated horizontal cable pull.',                                'beginner',     (select id from public.equipment where slug = 'cable'),           true),
  -- shoulders
  ('overhead-press',        'Barbell Overhead Press',     'Standing strict press from the front rack.',                  'intermediate', (select id from public.equipment where slug = 'barbell'),         true),
  ('dumbbell-shoulder-press','Dumbbell Shoulder Press',   'Seated or standing vertical press with dumbbells.',           'beginner',     (select id from public.equipment where slug = 'dumbbell'),        true),
  ('lateral-raise',         'Dumbbell Lateral Raise',     'Isolation raise for the lateral deltoid.',                    'beginner',     (select id from public.equipment where slug = 'dumbbell'),        true),
  ('face-pull',             'Cable Face Pull',            'High-cable pull to the face for rear delts and upper back.', 'beginner',     (select id from public.equipment where slug = 'cable'),           true),
  -- biceps
  ('barbell-curl',          'Barbell Curl',               'Standing barbell elbow flexion.',                              'beginner',     (select id from public.equipment where slug = 'barbell'),         true),
  ('dumbbell-curl',         'Dumbbell Curl',              'Alternating or simultaneous dumbbell elbow flexion.',         'beginner',     (select id from public.equipment where slug = 'dumbbell'),        true),
  ('hammer-curl',           'Hammer Curl',                'Neutral-grip dumbbell curl for biceps and brachialis.',       'beginner',     (select id from public.equipment where slug = 'dumbbell'),        true),
  -- triceps
  ('tricep-pushdown',       'Tricep Pushdown',            'Standing cable elbow extension.',                              'beginner',     (select id from public.equipment where slug = 'cable'),           true),
  ('skullcrusher',          'EZ-Bar Skullcrusher',        'Lying elbow extension with an EZ bar.',                       'intermediate', (select id from public.equipment where slug = 'ez-bar'),          true),
  ('close-grip-bench',      'Close-Grip Bench Press',     'Narrow-grip flat press emphasizing triceps.',                 'intermediate', (select id from public.equipment where slug = 'barbell'),         true),
  ('dip',                   'Parallel Bar Dip',           'Bodyweight vertical press on parallel bars.',                  'intermediate', (select id from public.equipment where slug = 'dip-bar'),         true),
  -- core
  ('plank',                 'Plank',                      'Isometric front-hold for the anterior core.',                  'beginner',     (select id from public.equipment where slug = 'bodyweight'),      true),
  ('hanging-leg-raise',     'Hanging Leg Raise',          'Hanging knee/leg raise for the rectus abdominis.',            'intermediate', (select id from public.equipment where slug = 'pull-up-bar'),    true),
  ('cable-crunch',          'Cable Crunch',               'Kneeling cable spinal flexion.',                               'beginner',     (select id from public.equipment where slug = 'cable'),           true),
  ('russian-twist',         'Russian Twist',              'Seated rotational core movement.',                             'beginner',     (select id from public.equipment where slug = 'medicine-ball'),   true),
  -- quadriceps
  ('back-squat',            'Barbell Back Squat',         'High- or low-bar squat with a barbell on the upper back.',    'intermediate', (select id from public.equipment where slug = 'barbell'),         true),
  ('front-squat',           'Barbell Front Squat',        'Front-racked squat emphasizing the quadriceps.',              'advanced',     (select id from public.equipment where slug = 'barbell'),         true),
  ('leg-press',             'Leg Press',                  'Machine compound leg press.',                                  'beginner',     (select id from public.equipment where slug = 'machine'),         true),
  ('walking-lunge',         'Walking Lunge',              'Alternating forward-stepping lunge.',                          'beginner',     (select id from public.equipment where slug = 'dumbbell'),        true),
  -- hamstrings & glutes
  ('deadlift',              'Conventional Deadlift',      'Hip-hinge full-body pull from the floor.',                    'advanced',     (select id from public.equipment where slug = 'barbell'),         true),
  ('romanian-deadlift',     'Romanian Deadlift',          'Hinge with controlled eccentric, knees soft.',                'intermediate', (select id from public.equipment where slug = 'barbell'),         true),
  ('hip-thrust',            'Barbell Hip Thrust',         'Glute-focused hip extension with a barbell across the hips.', 'intermediate', (select id from public.equipment where slug = 'barbell'),         true)
on conflict (slug) do nothing;

-- ============================================================================
-- exercise_muscles (primary + secondary mappings)
-- ============================================================================

-- chest
insert into public.exercise_muscles (exercise_id, muscle_group_id, role) values
  ((select id from public.exercises where slug = 'bench-press'),            (select id from public.muscle_groups where slug = 'chest'),     'primary'),
  ((select id from public.exercises where slug = 'bench-press'),            (select id from public.muscle_groups where slug = 'triceps'),   'secondary'),
  ((select id from public.exercises where slug = 'bench-press'),            (select id from public.muscle_groups where slug = 'shoulders'), 'secondary'),
  ((select id from public.exercises where slug = 'incline-dumbbell-press'), (select id from public.muscle_groups where slug = 'chest'),     'primary'),
  ((select id from public.exercises where slug = 'incline-dumbbell-press'), (select id from public.muscle_groups where slug = 'shoulders'), 'secondary'),
  ((select id from public.exercises where slug = 'incline-dumbbell-press'), (select id from public.muscle_groups where slug = 'triceps'),   'secondary'),
  ((select id from public.exercises where slug = 'push-up'),                (select id from public.muscle_groups where slug = 'chest'),     'primary'),
  ((select id from public.exercises where slug = 'push-up'),                (select id from public.muscle_groups where slug = 'triceps'),   'secondary'),
  ((select id from public.exercises where slug = 'push-up'),                (select id from public.muscle_groups where slug = 'core'),      'secondary'),
  ((select id from public.exercises where slug = 'dumbbell-fly'),           (select id from public.muscle_groups where slug = 'chest'),     'primary'),
  ((select id from public.exercises where slug = 'dumbbell-fly'),           (select id from public.muscle_groups where slug = 'shoulders'), 'secondary')
on conflict do nothing;

-- back
insert into public.exercise_muscles (exercise_id, muscle_group_id, role) values
  ((select id from public.exercises where slug = 'pull-up'),          (select id from public.muscle_groups where slug = 'back'),    'primary'),
  ((select id from public.exercises where slug = 'pull-up'),          (select id from public.muscle_groups where slug = 'biceps'),  'secondary'),
  ((select id from public.exercises where slug = 'pull-up'),          (select id from public.muscle_groups where slug = 'core'),    'secondary'),
  ((select id from public.exercises where slug = 'chin-up'),          (select id from public.muscle_groups where slug = 'back'),    'primary'),
  ((select id from public.exercises where slug = 'chin-up'),          (select id from public.muscle_groups where slug = 'biceps'),  'secondary'),
  ((select id from public.exercises where slug = 'barbell-row'),      (select id from public.muscle_groups where slug = 'back'),    'primary'),
  ((select id from public.exercises where slug = 'barbell-row'),      (select id from public.muscle_groups where slug = 'biceps'),  'secondary'),
  ((select id from public.exercises where slug = 'barbell-row'),      (select id from public.muscle_groups where slug = 'core'),    'secondary'),
  ((select id from public.exercises where slug = 'lat-pulldown'),     (select id from public.muscle_groups where slug = 'back'),    'primary'),
  ((select id from public.exercises where slug = 'lat-pulldown'),     (select id from public.muscle_groups where slug = 'biceps'),  'secondary'),
  ((select id from public.exercises where slug = 'seated-cable-row'), (select id from public.muscle_groups where slug = 'back'),    'primary'),
  ((select id from public.exercises where slug = 'seated-cable-row'), (select id from public.muscle_groups where slug = 'biceps'),  'secondary')
on conflict do nothing;

-- shoulders
insert into public.exercise_muscles (exercise_id, muscle_group_id, role) values
  ((select id from public.exercises where slug = 'overhead-press'),          (select id from public.muscle_groups where slug = 'shoulders'), 'primary'),
  ((select id from public.exercises where slug = 'overhead-press'),          (select id from public.muscle_groups where slug = 'triceps'),   'secondary'),
  ((select id from public.exercises where slug = 'overhead-press'),          (select id from public.muscle_groups where slug = 'core'),      'secondary'),
  ((select id from public.exercises where slug = 'dumbbell-shoulder-press'), (select id from public.muscle_groups where slug = 'shoulders'), 'primary'),
  ((select id from public.exercises where slug = 'dumbbell-shoulder-press'), (select id from public.muscle_groups where slug = 'triceps'),   'secondary'),
  ((select id from public.exercises where slug = 'lateral-raise'),           (select id from public.muscle_groups where slug = 'shoulders'), 'primary'),
  ((select id from public.exercises where slug = 'face-pull'),               (select id from public.muscle_groups where slug = 'shoulders'), 'primary'),
  ((select id from public.exercises where slug = 'face-pull'),               (select id from public.muscle_groups where slug = 'back'),      'secondary')
on conflict do nothing;

-- biceps
insert into public.exercise_muscles (exercise_id, muscle_group_id, role) values
  ((select id from public.exercises where slug = 'barbell-curl'),  (select id from public.muscle_groups where slug = 'biceps'), 'primary'),
  ((select id from public.exercises where slug = 'dumbbell-curl'), (select id from public.muscle_groups where slug = 'biceps'), 'primary'),
  ((select id from public.exercises where slug = 'hammer-curl'),   (select id from public.muscle_groups where slug = 'biceps'), 'primary')
on conflict do nothing;

-- triceps
insert into public.exercise_muscles (exercise_id, muscle_group_id, role) values
  ((select id from public.exercises where slug = 'tricep-pushdown'),  (select id from public.muscle_groups where slug = 'triceps'),   'primary'),
  ((select id from public.exercises where slug = 'skullcrusher'),     (select id from public.muscle_groups where slug = 'triceps'),   'primary'),
  ((select id from public.exercises where slug = 'close-grip-bench'), (select id from public.muscle_groups where slug = 'triceps'),   'primary'),
  ((select id from public.exercises where slug = 'close-grip-bench'), (select id from public.muscle_groups where slug = 'chest'),     'secondary'),
  ((select id from public.exercises where slug = 'close-grip-bench'), (select id from public.muscle_groups where slug = 'shoulders'), 'secondary'),
  ((select id from public.exercises where slug = 'dip'),              (select id from public.muscle_groups where slug = 'triceps'),   'primary'),
  ((select id from public.exercises where slug = 'dip'),              (select id from public.muscle_groups where slug = 'chest'),     'secondary'),
  ((select id from public.exercises where slug = 'dip'),              (select id from public.muscle_groups where slug = 'shoulders'), 'secondary')
on conflict do nothing;

-- core
insert into public.exercise_muscles (exercise_id, muscle_group_id, role) values
  ((select id from public.exercises where slug = 'plank'),             (select id from public.muscle_groups where slug = 'core'),      'primary'),
  ((select id from public.exercises where slug = 'plank'),             (select id from public.muscle_groups where slug = 'shoulders'), 'secondary'),
  ((select id from public.exercises where slug = 'hanging-leg-raise'), (select id from public.muscle_groups where slug = 'core'),      'primary'),
  ((select id from public.exercises where slug = 'cable-crunch'),      (select id from public.muscle_groups where slug = 'core'),      'primary'),
  ((select id from public.exercises where slug = 'russian-twist'),     (select id from public.muscle_groups where slug = 'core'),      'primary')
on conflict do nothing;

-- quadriceps
insert into public.exercise_muscles (exercise_id, muscle_group_id, role) values
  ((select id from public.exercises where slug = 'back-squat'),    (select id from public.muscle_groups where slug = 'quadriceps'),            'primary'),
  ((select id from public.exercises where slug = 'back-squat'),    (select id from public.muscle_groups where slug = 'hamstrings-and-glutes'), 'secondary'),
  ((select id from public.exercises where slug = 'back-squat'),    (select id from public.muscle_groups where slug = 'core'),                  'secondary'),
  ((select id from public.exercises where slug = 'front-squat'),   (select id from public.muscle_groups where slug = 'quadriceps'),            'primary'),
  ((select id from public.exercises where slug = 'front-squat'),   (select id from public.muscle_groups where slug = 'core'),                  'secondary'),
  ((select id from public.exercises where slug = 'leg-press'),     (select id from public.muscle_groups where slug = 'quadriceps'),            'primary'),
  ((select id from public.exercises where slug = 'leg-press'),     (select id from public.muscle_groups where slug = 'hamstrings-and-glutes'), 'secondary'),
  ((select id from public.exercises where slug = 'walking-lunge'), (select id from public.muscle_groups where slug = 'quadriceps'),            'primary'),
  ((select id from public.exercises where slug = 'walking-lunge'), (select id from public.muscle_groups where slug = 'hamstrings-and-glutes'), 'secondary')
on conflict do nothing;

-- hamstrings & glutes
insert into public.exercise_muscles (exercise_id, muscle_group_id, role) values
  ((select id from public.exercises where slug = 'deadlift'),          (select id from public.muscle_groups where slug = 'hamstrings-and-glutes'), 'primary'),
  ((select id from public.exercises where slug = 'deadlift'),          (select id from public.muscle_groups where slug = 'back'),                  'secondary'),
  ((select id from public.exercises where slug = 'deadlift'),          (select id from public.muscle_groups where slug = 'core'),                  'secondary'),
  ((select id from public.exercises where slug = 'romanian-deadlift'), (select id from public.muscle_groups where slug = 'hamstrings-and-glutes'), 'primary'),
  ((select id from public.exercises where slug = 'romanian-deadlift'), (select id from public.muscle_groups where slug = 'back'),                  'secondary'),
  ((select id from public.exercises where slug = 'hip-thrust'),        (select id from public.muscle_groups where slug = 'hamstrings-and-glutes'), 'primary'),
  ((select id from public.exercises where slug = 'hip-thrust'),        (select id from public.muscle_groups where slug = 'core'),                  'secondary')
on conflict do nothing;
