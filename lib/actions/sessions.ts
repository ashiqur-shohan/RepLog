"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/guards";
import { log } from "@/lib/log";
import { actionErr, actionOk, type ActionResult } from "@/lib/actions/types";
import { finishSessionSchema, logSetSchema, startSessionSchema, updateSetSchema } from "@/lib/validators/workout";

export async function startSession(input: {
  plan_day_id?: string;
  name?: string;
}): Promise<ActionResult<{ id: string }>> {
  const parsed = startSessionSchema.safeParse(input);
  if (!parsed.success) return actionErr("Invalid input");
  const { user, supabase } = await requireUser();
  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: user.id,
      plan_day_id: parsed.data.plan_day_id ?? null,
      name: parsed.data.name ?? null,
    })
    .select("id")
    .single();
  if (error || !data) return actionErr(error?.message ?? "Could not start session");
  return actionOk({ id: data.id });
}

export async function logSet(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = logSetSchema.safeParse(input);
  if (!parsed.success) return actionErr("Invalid input", parsed.error.flatten().fieldErrors);
  const { user, supabase } = await requireUser();
  const { data, error } = await supabase
    .from("session_sets")
    .insert({ ...parsed.data })
    .select("id")
    .single();
  if (error || !data) {
    log.warn("logSet failed", { userId: user.id, reason: error?.message });
    return actionErr(error?.message ?? "Could not log set");
  }
  return actionOk({ id: data.id });
}

export async function updateSet(input: unknown): Promise<ActionResult<void>> {
  const parsed = updateSetSchema.safeParse(input);
  if (!parsed.success) return actionErr("Invalid input");
  const { supabase } = await requireUser();
  const { id, ...patch } = parsed.data;
  const { error } = await supabase.from("session_sets").update(patch).eq("id", id);
  if (error) return actionErr(error.message);
  return actionOk(undefined);
}

export async function deleteSet(id: string): Promise<ActionResult<void>> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("session_sets").delete().eq("id", id);
  if (error) return actionErr(error.message);
  return actionOk(undefined);
}

export async function finishSession(input: { session_id: string; notes?: string }): Promise<ActionResult<void>> {
  const parsed = finishSessionSchema.safeParse(input);
  if (!parsed.success) return actionErr("Invalid input");
  const { user, supabase } = await requireUser();
  const { error } = await supabase
    .from("workout_sessions")
    .update({ finished_at: new Date().toISOString(), notes: parsed.data.notes ?? null })
    .eq("id", parsed.data.session_id)
    .eq("user_id", user.id);
  if (error) return actionErr(error.message);
  revalidatePath("/history");
  revalidatePath("/dashboard");
  return actionOk(undefined);
}

export async function getHistory({
  limit = 30,
  cursor,
}: { limit?: number; cursor?: string } = {}) {
  const { user, supabase } = await requireUser();
  let q = supabase
    .from("workout_sessions")
    .select(
      `id, name, started_at, finished_at, notes,
       plan_day:plan_days(id, name, plan:workout_plans(name)),
       session_sets(id, exercise_id, set_number, weight_kg, reps, rpe, is_warmup,
         exercise:exercises(id, name, slug))`,
    )
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .not("finished_at", "is", null)
    .order("started_at", { ascending: false })
    .limit(limit);
  if (cursor) q = q.lt("started_at", cursor);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getDashboardSummary() {
  const { user, supabase } = await requireUser();
  const [streakRes, prsRes, weekRes] = await Promise.all([
    supabase.rpc("current_streak", { p_user_id: user.id }),
    supabase
      .from("personal_records")
      .select("exercise:exercises(name), best_weight_kg, best_reps, achieved_at")
      .eq("user_id", user.id)
      .order("achieved_at", { ascending: false })
      .limit(4),
    supabase.rpc("weekly_volume", {
      p_user_id: user.id,
      p_week_start: new Date(new Date().setDate(new Date().getDate() - new Date().getDay()))
        .toISOString()
        .slice(0, 10),
    }),
  ]);
  return {
    streak: (streakRes.data as number | null) ?? 0,
    recentPRs: prsRes.data ?? [],
    weeklyVolume:
      (weekRes.data as Array<{
        muscle_group_id: string;
        muscle_slug: string;
        muscle_name: string;
        volume: number;
      }> | null) ?? [],
  };
}
