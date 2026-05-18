import { notFound } from "next/navigation";
import { ActiveWorkout } from "@/components/domain/workout/ActiveWorkout";
import { requireUser } from "@/lib/guards";

export default async function ActiveWorkoutPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const { user, supabase } = await requireUser();

  const { data: session } = await supabase
    .from("workout_sessions")
    .select(
      `id, started_at, finished_at, notes,
       plan_day:plan_days(id, name, day_number,
         plan:workout_plans(name),
         plan_day_exercises(id, exercise_id, position, target_sets, target_reps_min, target_reps_max, target_weight_kg, rest_seconds,
           exercise:exercises(id, name, slug, thumbnail_url, media_url, media_type)
         )
       ),
       session_sets(id, exercise_id, set_number, weight_kg, reps, rpe, is_warmup,
         exercise:exercises(id, name, slug, thumbnail_url, media_url, media_type)
       )`,
    )
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!session) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("weight_unit")
    .eq("id", user.id)
    .single();

  return (
    <ActiveWorkout
      session={session as any}
      weightUnit={(profile?.weight_unit as "kg" | "lb") ?? "kg"}
    />
  );
}
