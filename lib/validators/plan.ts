import { z } from "zod";

export const planCreateSchema = z.object({
  name: z.string().min(1).max(120).trim(),
  description: z.string().max(1000).optional().or(z.literal("")),
});

export const planDaySchema = z.object({
  plan_id: z.string().uuid(),
  name: z.string().min(1).max(80).trim(),
  day_number: z.number().int().min(1).max(31),
});

export const planDayExerciseSchema = z.object({
  plan_day_id: z.string().uuid(),
  exercise_id: z.string().uuid(),
  position: z.number().int().min(1),
  target_sets: z.number().int().min(1).max(20).optional(),
  target_reps_min: z.number().int().min(0).max(200).optional(),
  target_reps_max: z.number().int().min(0).max(200).optional(),
  target_weight_kg: z.number().min(0).max(1000).optional(),
  rest_seconds: z.number().int().min(0).max(3600).optional(),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export const reorderExercisesSchema = z.object({
  plan_day_id: z.string().uuid(),
  ordered_ids: z.array(z.string().uuid()).min(1).max(50),
});

export type PlanCreateInput = z.infer<typeof planCreateSchema>;
export type PlanDayInput = z.infer<typeof planDaySchema>;
export type PlanDayExerciseInput = z.infer<typeof planDayExerciseSchema>;
