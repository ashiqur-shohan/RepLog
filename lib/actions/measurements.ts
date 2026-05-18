"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/guards";
import { actionErr, actionOk, type ActionResult } from "@/lib/actions/types";
import { measurementSchema } from "@/lib/validators/workout";
import { z } from "zod";

const ALLOWED_METRICS = ["bodyweight", "body_fat", "waist", "chest", "arm", "thigh", "hip"] as const;
type Metric = (typeof ALLOWED_METRICS)[number];

const ALLOWED_RANGES = ["4W", "12W", "6M", "1Y", "all"] as const;
type Range = (typeof ALLOWED_RANGES)[number];

export interface Measurement {
  id: string;
  metric: string;
  value: number;
  unit: string;
  measured_at: string;
  note: string | null;
}

function rangeToStartDate(range: Range): string {
  const now = new Date();
  switch (range) {
    case "4W":
      now.setDate(now.getDate() - 28);
      break;
    case "12W":
      now.setDate(now.getDate() - 84);
      break;
    case "6M":
      now.setMonth(now.getMonth() - 6);
      break;
    case "1Y":
      now.setFullYear(now.getFullYear() - 1);
      break;
    case "all":
      return "1970-01-01T00:00:00.000Z";
  }
  return now.toISOString();
}

export async function addMeasurement(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = measurementSchema.safeParse(input);
  if (!parsed.success) return actionErr("Invalid input", parsed.error.flatten().fieldErrors);

  const { user, supabase } = await requireUser();
  const { data: raw, error } = await supabase
    .from("body_measurements")
    .insert({
      user_id: user.id,
      metric: parsed.data.metric,
      value: parsed.data.value,
      unit: parsed.data.unit,
      measured_at: parsed.data.measured_at ?? new Date().toISOString(),
      note: parsed.data.note || null,
    } as never)
    .select("id")
    .single();

  if (error || !raw) return actionErr(error?.message ?? "Could not save measurement");
  const data = raw as { id: string };
  revalidatePath("/app/progress");
  return actionOk({ id: data.id });
}

export async function listMeasurements(metric: Metric, range: Range): Promise<Measurement[]> {
  const { user, supabase } = await requireUser();
  const startDate = rangeToStartDate(range);

  const { data: raw, error } = await supabase
    .from("body_measurements")
    .select("id, metric, value, unit, measured_at, note")
    .eq("user_id", user.id)
    .eq("metric", metric as string)
    .is("deleted_at", null)
    .gte("measured_at", startDate)
    .order("measured_at", { ascending: true });

  if (error) throw error;
  return (raw as Measurement[] | null) ?? [];
}

export async function deleteMeasurement(id: string): Promise<ActionResult<void>> {
  const idParsed = z.string().uuid().safeParse(id);
  if (!idParsed.success) return actionErr("Invalid id");

  const { user, supabase } = await requireUser();
  const { error } = await supabase
    .from("body_measurements")
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq("id", idParsed.data)
    .eq("user_id", user.id);

  if (error) return actionErr(error.message);
  revalidatePath("/app/progress");
  return actionOk(undefined);
}
