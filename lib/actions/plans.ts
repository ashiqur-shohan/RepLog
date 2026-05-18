"use server";

import { revalidatePath } from "next/cache";
import { requireUser, getEntitlements, QuotaExceededError } from "@/lib/guards";
import { planCreateSchema, planDayExerciseSchema, planDaySchema, reorderExercisesSchema } from "@/lib/validators/plan";
import { actionErr, actionOk, type ActionResult } from "@/lib/actions/types";

const FREE_PLAN_LIMIT = 1;

export async function listPlans() {
  const { user, supabase } = await requireUser();
  const { data, error } = await supabase
    .from("workout_plans")
    .select("id, name, description, is_active, created_at, updated_at")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getPlan(planId: string) {
  const { user, supabase } = await requireUser();
  const { data, error } = await supabase
    .from("workout_plans")
    .select(
      `id, name, description, is_active, plan_days(id, name, position,
        plan_day_exercises(id, exercise_id, position, target_sets,
          target_reps_min, target_reps_max, target_weight_kg, rest_seconds, notes,
          exercise:exercises(id, name, slug, thumbnail_url, media_url, media_type)
        )
      )`,
    )
    .eq("id", planId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();
  if (error) return null;
  return data;
}

export async function createPlan(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const { user, supabase } = await requireUser();
  const parsed = planCreateSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || "",
  });
  if (!parsed.success) return actionErr("Invalid input", parsed.error.flatten().fieldErrors);

  const { isPro } = await getEntitlements();
  if (!isPro) {
    const { count } = await supabase
      .from("workout_plans")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("deleted_at", null);
    if ((count ?? 0) >= FREE_PLAN_LIMIT) {
      return actionErr("Free plan limit reached. Upgrade to Pro for unlimited plans.");
    }
  }

  const { data, error } = await supabase
    .from("workout_plans")
    .insert({ user_id: user.id, name: parsed.data.name, description: parsed.data.description })
    .select("id")
    .single();
  if (error || !data) return actionErr(error?.message ?? "Could not create plan");
  revalidatePath("/plans");
  return actionOk({ id: data.id });
}

export async function addPlanDay(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const { supabase } = await requireUser();
  const parsed = planDaySchema.safeParse({
    plan_id: formData.get("plan_id"),
    name: formData.get("name"),
    position: Number(formData.get("position")),
  });
  if (!parsed.success) return actionErr("Invalid input", parsed.error.flatten().fieldErrors);
  const { data, error } = await supabase
    .from("plan_days")
    .insert(parsed.data)
    .select("id")
    .single();
  if (error || !data) return actionErr(error?.message ?? "Could not create day");
  revalidatePath(`/plans/${parsed.data.plan_id}/edit`);
  return actionOk({ id: data.id });
}

export async function addPlanExercise(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const { supabase } = await requireUser();
  const parsed = planDayExerciseSchema.safeParse({
    plan_day_id: formData.get("plan_day_id"),
    exercise_id: formData.get("exercise_id"),
    position: Number(formData.get("position")),
    target_sets: formData.get("target_sets") ? Number(formData.get("target_sets")) : undefined,
    target_reps_min: formData.get("target_reps_min") ? Number(formData.get("target_reps_min")) : undefined,
    target_reps_max: formData.get("target_reps_max") ? Number(formData.get("target_reps_max")) : undefined,
    target_rpe: formData.get("target_rpe") ? Number(formData.get("target_rpe")) : undefined,
    rest_seconds: formData.get("rest_seconds") ? Number(formData.get("rest_seconds")) : undefined,
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) return actionErr("Invalid input", parsed.error.flatten().fieldErrors);

  const { data, error } = await supabase
    .from("plan_day_exercises")
    .insert(parsed.data)
    .select("id")
    .single();
  if (error || !data) return actionErr(error?.message ?? "Could not add exercise");
  return actionOk({ id: data.id });
}

export async function reorderPlanExercises(input: {
  plan_day_id: string;
  ordered_ids: string[];
}): Promise<ActionResult<void>> {
  const parsed = reorderExercisesSchema.safeParse(input);
  if (!parsed.success) return actionErr("Invalid input");

  const { supabase } = await requireUser();
  // Bulk update positions; a real implementation would do this in a single RPC.
  const updates = parsed.data.ordered_ids.map((id, index) =>
    supabase
      .from("plan_day_exercises")
      .update({ position: index + 1 })
      .eq("id", id)
      .eq("plan_day_id", parsed.data.plan_day_id),
  );
  const results = await Promise.all(updates);
  if (results.some((r) => r.error)) return actionErr("Could not reorder");
  return actionOk(undefined);
}

export async function deletePlan(planId: string): Promise<ActionResult<void>> {
  const { user, supabase } = await requireUser();
  const { error } = await supabase
    .from("workout_plans")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", planId)
    .eq("user_id", user.id);
  if (error) return actionErr(error.message);
  revalidatePath("/plans");
  return actionOk(undefined);
}
