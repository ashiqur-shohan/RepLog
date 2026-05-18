// Generated types matching supabase/migrations/0001..0005.
// After applying migrations to a live Supabase project, you can regenerate
// with: pnpm dlx supabase gen types typescript --project-id <id> > lib/supabase/database.types.ts
// — and overwrite this file.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type WeightUnit = "kg" | "lb";
type ExerciseDifficulty = "beginner" | "intermediate" | "advanced";
type MuscleRole = "primary" | "secondary";
type SubscriptionTier = "free" | "pro";
type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "paused";
type MeasurementUnit = "kg" | "lb" | "cm" | "in" | "percent";
type MediaType = "gif" | "mp4" | "webm";

type Timestamp = string;
type Uuid = string;
type DateString = string;

type DefaultedCols = { created_at: Timestamp; updated_at: Timestamp };
type SoftDelete = { deleted_at: Timestamp | null };

interface ProfilesRow extends DefaultedCols {
  id: Uuid;
  display_name: string;
  avatar_url: string | null;
  weight_unit: WeightUnit;
  timezone: string;
  date_of_birth: DateString | null;
  height_cm: number | null;
  gender: "male" | "female" | "other" | "prefer_not_to_say" | null;
  goal: "build_muscle" | "get_stronger" | "stay_consistent" | "lose_weight" | null;
  experience: "beginner" | "intermediate" | "advanced" | null;
  onboarded_at: Timestamp | null;
}

interface MuscleGroupsRow extends DefaultedCols {
  id: Uuid;
  name: string;
  slug: string;
  display_order: number;
}

interface EquipmentRow extends DefaultedCols {
  id: Uuid;
  name: string;
  slug: string;
}

interface ExercisesRow extends DefaultedCols, SoftDelete {
  id: Uuid;
  name: string;
  slug: string;
  description: string | null;
  instructions: string | null;
  difficulty: ExerciseDifficulty;
  equipment_id: Uuid | null;
  is_unilateral: boolean;
  is_global: boolean;
  created_by: Uuid | null;
  media_url: string | null;
  media_type: MediaType | null;
  thumbnail_url: string | null;
  media_attribution: string | null;
}

interface ExerciseMusclesRow extends DefaultedCols {
  exercise_id: Uuid;
  muscle_group_id: Uuid;
  role: MuscleRole;
}

interface WorkoutPlansRow extends DefaultedCols, SoftDelete {
  id: Uuid;
  user_id: Uuid;
  name: string;
  description: string | null;
  is_active: boolean;
}

interface PlanDaysRow extends DefaultedCols, SoftDelete {
  id: Uuid;
  plan_id: Uuid;
  name: string;
  position: number;
}

interface PlanDayExercisesRow extends DefaultedCols, SoftDelete {
  id: Uuid;
  plan_day_id: Uuid;
  exercise_id: Uuid;
  position: number;
  target_sets: number | null;
  target_reps_min: number | null;
  target_reps_max: number | null;
  target_rpe: number | null;
  rest_seconds: number | null;
  notes: string | null;
}

interface WorkoutSessionsRow extends DefaultedCols, SoftDelete {
  id: Uuid;
  user_id: Uuid;
  plan_id: Uuid | null;
  plan_day_id: Uuid | null;
  name: string | null;
  started_at: Timestamp;
  finished_at: Timestamp | null;
  notes: string | null;
}

interface SessionSetsRow extends DefaultedCols {
  id: Uuid;
  session_id: Uuid;
  exercise_id: Uuid;
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
  duration_s: number | null;
  rpe: number | null;
  is_warmup: boolean;
  notes: string | null;
  logged_at: Timestamp;
}

interface PersonalRecordsRow extends DefaultedCols {
  id: Uuid;
  user_id: Uuid;
  exercise_id: Uuid;
  best_weight_kg: number | null;
  best_reps: number | null;
  best_volume: number | null;
  achieved_at: Timestamp;
  session_id: Uuid | null;
}

interface BodyMeasurementsRow extends DefaultedCols, SoftDelete {
  id: Uuid;
  user_id: Uuid;
  metric: string;
  value: number;
  unit: MeasurementUnit;
  measured_at: Timestamp;
  notes: string | null;
}

interface SubscriptionsRow extends DefaultedCols {
  id: Uuid;
  user_id: Uuid;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  current_period_start: Timestamp | null;
  current_period_end: Timestamp | null;
  cancel_at_period_end: boolean;
  amount_cents: number | null;
  currency: string | null;
}

interface NotificationPrefsRow extends DefaultedCols {
  id: Uuid;
  user_id: Uuid;
  email_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  rest_reminder: boolean;
  weekly_summary: boolean;
}

interface AuditLogRow {
  id: Uuid;
  user_id: Uuid | null;
  action: "insert" | "update" | "delete" | "soft_delete";
  table_name: string;
  record_id: Uuid | null;
  old_data: Json | null;
  new_data: Json | null;
  ip_address: string | null;
  created_at: Timestamp;
}

type TableShape<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableShape<ProfilesRow>;
      muscle_groups: TableShape<MuscleGroupsRow>;
      equipment: TableShape<EquipmentRow>;
      exercises: TableShape<ExercisesRow>;
      exercise_muscles: TableShape<ExerciseMusclesRow>;
      workout_plans: TableShape<WorkoutPlansRow>;
      plan_days: TableShape<PlanDaysRow>;
      plan_day_exercises: TableShape<PlanDayExercisesRow>;
      workout_sessions: TableShape<WorkoutSessionsRow>;
      session_sets: TableShape<SessionSetsRow>;
      personal_records: TableShape<PersonalRecordsRow>;
      body_measurements: TableShape<BodyMeasurementsRow>;
      subscriptions: TableShape<SubscriptionsRow>;
      notification_prefs: TableShape<NotificationPrefsRow>;
      audit_log: TableShape<AuditLogRow>;
    };
    Views: {
      v_user_dashboard: {
        Row: {
          user_id: Uuid;
          display_name: string;
          weight_unit: WeightUnit;
          subscription_tier: SubscriptionTier | null;
          subscription_status: SubscriptionStatus | null;
          total_sessions: number;
          last_session_at: Timestamp | null;
          current_streak: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      current_streak: {
        Args: { p_user_id: Uuid };
        Returns: number;
      };
      personal_record_for: {
        Args: { p_user_id: Uuid; p_exercise_id: Uuid };
        Returns: Array<{
          best_weight_kg: number;
          best_reps: number;
          best_volume: number;
          achieved_at: Timestamp;
        }>;
      };
      weekly_volume: {
        Args: { p_user_id: Uuid; p_week_start: DateString };
        Returns: Array<{ muscle_group: string; total_volume: number }>;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      purge_soft_deleted: {
        Args: Record<string, never>;
        Returns: number;
      };
    };
    Enums: {
      weight_unit: WeightUnit;
      exercise_difficulty: ExerciseDifficulty;
      muscle_role: MuscleRole;
      subscription_tier: SubscriptionTier;
      subscription_status: SubscriptionStatus;
      measurement_unit: MeasurementUnit;
    };
    CompositeTypes: Record<string, never>;
  };
};
