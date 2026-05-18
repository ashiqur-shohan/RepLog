import { z } from "zod";

export const startSessionSchema = z.object({
  plan_day_id: z.string().uuid().optional(),
  name: z.string().max(120).optional(),
});

// session_sets.weight_kg and .reps are NOT NULL in the schema with default 0,
// so the API requires non-null values. The client uses 0 for "bodyweight" or
// "no reps yet" sets.
export const logSetSchema = z.object({
  session_id: z.string().uuid(),
  exercise_id: z.string().uuid(),
  set_number: z.number().int().min(1).max(50),
  weight_kg: z.number().min(0).max(1000),
  reps: z.number().int().min(0).max(500),
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
  metric: z.enum(["bodyweight", "body_fat", "waist", "chest", "arm", "thigh", "hip"]),
  value: z.number().min(0).max(1000),
  unit: z.enum(["kg", "lb", "cm", "in", "percent"]),
  measured_at: z.string().datetime().optional(),
  note: z.string().max(500).optional().or(z.literal("")),
});

export type LogSetInput = z.infer<typeof logSetSchema>;
export type MeasurementInput = z.infer<typeof measurementSchema>;
