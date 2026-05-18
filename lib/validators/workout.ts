import { z } from "zod";

export const startSessionSchema = z.object({
  plan_day_id: z.string().uuid().optional(),
  name: z.string().max(120).optional(),
});

export const logSetSchema = z.object({
  session_id: z.string().uuid(),
  exercise_id: z.string().uuid(),
  set_number: z.number().int().min(1).max(50),
  weight_kg: z.number().min(0).max(1000).nullable(),
  reps: z.number().int().min(0).max(500).nullable(),
  duration_s: z.number().int().min(0).max(36000).nullable().optional(),
  rpe: z.number().min(1).max(10).nullable().optional(),
  is_warmup: z.boolean().default(false),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export const updateSetSchema = logSetSchema.extend({
  id: z.string().uuid(),
});

export const finishSessionSchema = z.object({
  session_id: z.string().uuid(),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export const measurementSchema = z.object({
  metric: z.enum(["bodyweight", "body_fat_pct", "waist", "chest", "arm", "thigh"]),
  value: z.number().min(0).max(1000),
  unit: z.enum(["kg", "lb", "cm", "in", "percent"]),
  measured_at: z.string().datetime().optional(),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export type LogSetInput = z.infer<typeof logSetSchema>;
export type MeasurementInput = z.infer<typeof measurementSchema>;
