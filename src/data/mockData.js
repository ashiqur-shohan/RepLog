export const mockUser = {
  id: "u001",
  name: "Shohan Ahmed",
  age: 26,
  height_cm: 167.5,
  weight_kg: 70,
  goal: "Fat Loss + Muscle Gain",
  target_weight_kg: 65,
  avatar_initials: "SA",
  joined_date: "2025-05-01",
  streak_days: 12,
  total_workouts: 28,
};

export const mockBodyMetrics = [
  { id: "bm001", date: "2025-05-01", weight_kg: 70.0, bmi: 24.9 },
  { id: "bm002", date: "2025-05-15", weight_kg: 69.2, bmi: 24.6 },
  { id: "bm003", date: "2025-06-01", weight_kg: 68.5, bmi: 24.4 },
  { id: "bm004", date: "2025-06-15", weight_kg: 67.8, bmi: 24.1 },
  { id: "bm005", date: "2025-07-01", weight_kg: 67.0, bmi: 23.8 },
  { id: "bm006", date: "2025-07-15", weight_kg: 66.3, bmi: 23.6 },
];

export const mockExercises = [
  { id: "EX001", name: "Incline Push-Up", category: "Push", muscle_primary: "Chest (Upper)", muscle_secondary: "Triceps, Shoulders", equipment: "Bodyweight", difficulty: "Beginner" },
  { id: "EX002", name: "Standard Push-Up", category: "Push", muscle_primary: "Chest", muscle_secondary: "Triceps, Shoulders", equipment: "Bodyweight", difficulty: "Beginner" },
  { id: "EX003", name: "Decline Push-Up", category: "Push", muscle_primary: "Chest (Lower)", muscle_secondary: "Triceps, Shoulders", equipment: "Bodyweight", difficulty: "Intermediate" },
  { id: "EX004", name: "Diamond Push-Up", category: "Push", muscle_primary: "Triceps", muscle_secondary: "Chest (Inner)", equipment: "Bodyweight", difficulty: "Intermediate" },
  { id: "EX005", name: "Wide Push-Up", category: "Push", muscle_primary: "Chest (Outer)", muscle_secondary: "Shoulders", equipment: "Bodyweight", difficulty: "Beginner" },
  { id: "EX006", name: "DB Shoulder Press", category: "Push", muscle_primary: "Shoulders", muscle_secondary: "Triceps", equipment: "Dumbbell", difficulty: "Beginner" },
  { id: "EX007", name: "Lateral Raise", category: "Push", muscle_primary: "Lateral Delts", muscle_secondary: "Traps", equipment: "Dumbbell", difficulty: "Beginner" },
  { id: "EX008", name: "Front Raise", category: "Push", muscle_primary: "Front Delts", muscle_secondary: "Chest", equipment: "Dumbbell", difficulty: "Beginner" },
  { id: "EX009", name: "Bench Triceps Dip", category: "Push", muscle_primary: "Triceps", muscle_secondary: "Chest (Lower)", equipment: "Bodyweight", difficulty: "Beginner" },
  { id: "EX010", name: "Overhead Tricep Extension", category: "Push", muscle_primary: "Triceps", muscle_secondary: "Shoulders", equipment: "Dumbbell", difficulty: "Beginner" },
  { id: "EX011", name: "Bicep Curl", category: "Pull", muscle_primary: "Biceps", muscle_secondary: "Forearms", equipment: "Dumbbell", difficulty: "Beginner" },
  { id: "EX012", name: "Hammer Curl", category: "Pull", muscle_primary: "Biceps (Brachialis)", muscle_secondary: "Forearms", equipment: "Dumbbell", difficulty: "Beginner" },
  { id: "EX013", name: "Concentration Curl", category: "Pull", muscle_primary: "Biceps", muscle_secondary: "Forearms", equipment: "Dumbbell", difficulty: "Beginner" },
  { id: "EX014", name: "Bent-Over Row", category: "Pull", muscle_primary: "Lats, Rhomboids", muscle_secondary: "Biceps, Rear Delts", equipment: "Dumbbell", difficulty: "Intermediate" },
  { id: "EX015", name: "Single-Arm DB Row", category: "Pull", muscle_primary: "Lats", muscle_secondary: "Biceps, Traps", equipment: "Dumbbell", difficulty: "Beginner" },
  { id: "EX016", name: "Pull-Up", category: "Pull", muscle_primary: "Lats, Biceps", muscle_secondary: "Rhomboids, Traps", equipment: "Pull-up Bar", difficulty: "Intermediate" },
  { id: "EX017", name: "Chin-Up", category: "Pull", muscle_primary: "Biceps, Lats", muscle_secondary: "Rhomboids", equipment: "Pull-up Bar", difficulty: "Intermediate" },
  { id: "EX018", name: "Palms-Up Wrist Curl", category: "Pull", muscle_primary: "Forearms (Flexors)", muscle_secondary: "Biceps", equipment: "Dumbbell", difficulty: "Beginner" },
  { id: "EX019", name: "Palms-Down Wrist Curl", category: "Pull", muscle_primary: "Forearms (Extensors)", muscle_secondary: "None", equipment: "Dumbbell", difficulty: "Beginner" },
  { id: "EX020", name: "Bodyweight Squat", category: "Legs", muscle_primary: "Quadriceps", muscle_secondary: "Glutes, Hamstrings", equipment: "Bodyweight", difficulty: "Beginner" },
  { id: "EX021", name: "Goblet Squat", category: "Legs", muscle_primary: "Quadriceps", muscle_secondary: "Glutes, Core", equipment: "Dumbbell", difficulty: "Beginner" },
  { id: "EX022", name: "Reverse Lunge", category: "Legs", muscle_primary: "Quadriceps", muscle_secondary: "Glutes, Hamstrings", equipment: "Bodyweight", difficulty: "Beginner" },
  { id: "EX023", name: "Forward Lunge", category: "Legs", muscle_primary: "Quadriceps", muscle_secondary: "Glutes, Calves", equipment: "Bodyweight", difficulty: "Beginner" },
  { id: "EX024", name: "Glute Bridge", category: "Legs", muscle_primary: "Glutes", muscle_secondary: "Hamstrings, Core", equipment: "Bodyweight", difficulty: "Beginner" },
  { id: "EX025", name: "Romanian Deadlift", category: "Legs", muscle_primary: "Hamstrings", muscle_secondary: "Glutes, Lower Back", equipment: "Dumbbell", difficulty: "Intermediate" },
  { id: "EX026", name: "Single-Leg Calf Raise", category: "Legs", muscle_primary: "Calves", muscle_secondary: "None", equipment: "Bodyweight", difficulty: "Beginner" },
  { id: "EX027", name: "Crunch", category: "Core", muscle_primary: "Upper Abs", muscle_secondary: "None", equipment: "Bodyweight", difficulty: "Beginner" },
  { id: "EX028", name: "Bicycle Crunch", category: "Core", muscle_primary: "Abs, Obliques", muscle_secondary: "Hip Flexors", equipment: "Bodyweight", difficulty: "Beginner" },
  { id: "EX029", name: "Leg Raise", category: "Core", muscle_primary: "Lower Abs", muscle_secondary: "Hip Flexors", equipment: "Bodyweight", difficulty: "Beginner" },
  { id: "EX030", name: "Reverse Crunch", category: "Core", muscle_primary: "Lower Abs", muscle_secondary: "Core", equipment: "Bodyweight", difficulty: "Beginner" },
  { id: "EX031", name: "Plank", category: "Core", muscle_primary: "Full Core", muscle_secondary: "Shoulders, Glutes", equipment: "Bodyweight", difficulty: "Beginner" },
  { id: "EX032", name: "Side Plank", category: "Core", muscle_primary: "Obliques", muscle_secondary: "Glutes, Shoulders", equipment: "Bodyweight", difficulty: "Beginner" },
  { id: "EX033", name: "Mountain Climber", category: "Core", muscle_primary: "Full Core", muscle_secondary: "Shoulders, Cardio", equipment: "Bodyweight", difficulty: "Intermediate" },
  { id: "EX034", name: "Burpees", category: "Cardio", muscle_primary: "Full Body", muscle_secondary: "Chest, Legs, Core", equipment: "Bodyweight", difficulty: "Intermediate" },
  { id: "EX035", name: "Jumping Jacks", category: "Cardio", muscle_primary: "Full Body", muscle_secondary: "None", equipment: "Bodyweight", difficulty: "Beginner" },
];

export const mockWeeklyPlan = {
  week_label: "Current Week",
  days: {
    Saturday:  { split: "Push",        color: "#EF4444", exercises: ["EX002","EX003","EX005","EX004","EX006","EX007","EX009","EX010"] },
    Sunday:    { split: "Pull",        color: "#3B82F6", exercises: ["EX014","EX015","EX011","EX012","EX013","EX018","EX019"] },
    Monday:    { split: "Legs",        color: "#22C55E", exercises: ["EX021","EX022","EX025","EX024","EX026"] },
    Tuesday:   { split: "Core+Cardio",color: "#F59E0B", exercises: ["EX031","EX032","EX027","EX028","EX029","EX030","EX033","EX034"] },
    Wednesday: { split: "Push",        color: "#EF4444", exercises: ["EX001","EX002","EX004","EX006","EX008","EX009","EX010"] },
    Thursday:  { split: "Pull",        color: "#3B82F6", exercises: ["EX016","EX011","EX012","EX018","EX019","EX015"] },
    Friday:    { split: "Rest",        color: "#6B7280", exercises: [] },
  }
};

export const mockWorkoutLogs = [
  {
    id: "WL001", date: "2025-07-14", day: "Monday", split: "Legs", duration_min: 52, total_sets: 15,
    exercises: [
      { exercise_id: "EX021", name: "Goblet Squat",     sets: [{reps:12,weight:10},{reps:12,weight:10},{reps:10,weight:12}] },
      { exercise_id: "EX022", name: "Reverse Lunge",    sets: [{reps:12,weight:0},{reps:12,weight:0},{reps:10,weight:0}] },
      { exercise_id: "EX025", name: "Romanian Deadlift",sets: [{reps:10,weight:12},{reps:10,weight:12},{reps:8,weight:14}] },
      { exercise_id: "EX024", name: "Glute Bridge",     sets: [{reps:20,weight:0},{reps:20,weight:0},{reps:18,weight:0}] },
      { exercise_id: "EX026", name: "Calf Raise",       sets: [{reps:20,weight:0},{reps:20,weight:0},{reps:18,weight:0}] },
    ]
  },
  {
    id: "WL002", date: "2025-07-13", day: "Sunday", split: "Pull", duration_min: 48, total_sets: 18,
    exercises: [
      { exercise_id: "EX014", name: "Bent-Over Row", sets: [{reps:10,weight:12},{reps:10,weight:12},{reps:8,weight:14}] },
      { exercise_id: "EX011", name: "Bicep Curl",    sets: [{reps:12,weight:8},{reps:12,weight:8},{reps:10,weight:10}] },
      { exercise_id: "EX012", name: "Hammer Curl",   sets: [{reps:12,weight:8},{reps:12,weight:8},{reps:10,weight:10}] },
      { exercise_id: "EX018", name: "Wrist Curl",    sets: [{reps:20,weight:5},{reps:20,weight:5},{reps:18,weight:5}] },
    ]
  },
  {
    id: "WL003", date: "2025-07-12", day: "Saturday", split: "Push", duration_min: 55, total_sets: 21,
    exercises: [
      { exercise_id: "EX002", name: "Push-Up",          sets: [{reps:15,weight:0},{reps:12,weight:0},{reps:10,weight:0}] },
      { exercise_id: "EX003", name: "Decline Push-Up",  sets: [{reps:12,weight:0},{reps:10,weight:0},{reps:8,weight:0}] },
      { exercise_id: "EX004", name: "Diamond Push-Up",  sets: [{reps:8,weight:0},{reps:7,weight:0},{reps:6,weight:0}] },
      { exercise_id: "EX006", name: "DB Shoulder Press",sets: [{reps:12,weight:10},{reps:12,weight:10},{reps:10,weight:10}] },
      { exercise_id: "EX009", name: "Triceps Dip",      sets: [{reps:15,weight:0},{reps:12,weight:0},{reps:10,weight:0}] },
      { exercise_id: "EX010", name: "Tri Extension",    sets: [{reps:12,weight:8},{reps:12,weight:8},{reps:10,weight:8}] },
    ]
  },
  {
    id: "WL004", date: "2025-07-11", day: "Friday", split: "Rest", duration_min: 20, total_sets: 0,
    exercises: []
  },
  {
    id: "WL005", date: "2025-07-10", day: "Thursday", split: "Pull", duration_min: 50, total_sets: 18,
    exercises: [
      { exercise_id: "EX016", name: "Pull-Up",    sets: [{reps:6,weight:0},{reps:5,weight:0},{reps:5,weight:0}] },
      { exercise_id: "EX011", name: "Bicep Curl", sets: [{reps:12,weight:8},{reps:12,weight:10},{reps:10,weight:10}] },
      { exercise_id: "EX012", name: "Hammer Curl",sets: [{reps:12,weight:8},{reps:12,weight:8},{reps:10,weight:10}] },
    ]
  },
  {
    id: "WL006", date: "2025-07-09", day: "Wednesday", split: "Push", duration_min: 53, total_sets: 19,
    exercises: [
      { exercise_id: "EX001", name: "Incline Push-Up", sets: [{reps:15,weight:0},{reps:15,weight:0},{reps:12,weight:0}] },
      { exercise_id: "EX002", name: "Push-Up",         sets: [{reps:15,weight:0},{reps:13,weight:0},{reps:11,weight:0}] },
      { exercise_id: "EX004", name: "Diamond Push-Up", sets: [{reps:8,weight:0},{reps:7,weight:0},{reps:6,weight:0}] },
    ]
  },
  {
    id: "WL007", date: "2025-07-08", day: "Tuesday", split: "Core+Cardio", duration_min: 45, total_sets: 16,
    exercises: [
      { exercise_id: "EX031", name: "Plank",    sets: [{reps:45,weight:0},{reps:45,weight:0},{reps:40,weight:0}] },
      { exercise_id: "EX027", name: "Crunch",   sets: [{reps:25,weight:0},{reps:22,weight:0},{reps:20,weight:0}] },
      { exercise_id: "EX029", name: "Leg Raise",sets: [{reps:15,weight:0},{reps:15,weight:0},{reps:12,weight:0}] },
      { exercise_id: "EX034", name: "Burpees",  sets: [{reps:10,weight:0},{reps:10,weight:0},{reps:8,weight:0}] },
    ]
  },
];

export const mockStats = {
  current_streak: 12,
  longest_streak: 18,
  total_workouts_all_time: 28,
  this_week_sessions: 4,
  this_week_volume_kg: 1840,
  avg_session_duration_min: 50,
  workouts_this_month: 18,
  completion_rate_percent: 85,
  weekly_volume_trend: [
    { week: "W1 May", volume: 980 },
    { week: "W2 May", volume: 1120 },
    { week: "W3 May", volume: 1350 },
    { week: "W4 May", volume: 1200 },
    { week: "W1 Jun", volume: 1480 },
    { week: "W2 Jun", volume: 1620 },
    { week: "W3 Jun", volume: 1550 },
    { week: "W4 Jun", volume: 1840 },
  ],
  sessions_per_week: [
    { week: "W1 May", sessions: 4 },
    { week: "W2 May", sessions: 5 },
    { week: "W3 May", sessions: 4 },
    { week: "W4 May", sessions: 5 },
    { week: "W1 Jun", sessions: 5 },
    { week: "W2 Jun", sessions: 6 },
    { week: "W3 Jun", sessions: 5 },
    { week: "W4 Jun", sessions: 4 },
  ],
};
