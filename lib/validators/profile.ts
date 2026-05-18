import { z } from "zod";

export const weightUnit = z.enum(["kg", "lb"]);

export const profileUpdateSchema = z.object({
  display_name: z
    .string()
    .min(1, "Name is required")
    .max(60, "Name is too long")
    .trim(),
  weight_unit: weightUnit,
  timezone: z.string().min(1).max(64),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .optional()
    .or(z.literal("")),
  height_cm: z
    .number()
    .int()
    .positive()
    .max(300)
    .optional()
    .or(z.literal("")),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
});

export const onboardingSchema = z.object({
  goal: z.enum(["build_muscle", "get_stronger", "stay_consistent", "lose_weight"]),
  weight_unit: weightUnit,
  experience: z.enum(["beginner", "intermediate", "advanced"]),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
