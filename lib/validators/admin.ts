import { z } from "zod";

// ---------------------------------------------------------------------------
// Exercise upsert
// ---------------------------------------------------------------------------

export const upsertExerciseSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "Name must be at least 2 characters").max(120),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, or hyphens"),
  description: z.string().max(2000).optional().nullable(),
  instructions: z.string().max(5000).optional().nullable(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  equipment_id: z.string().uuid().optional().nullable(),
  is_global: z.literal(true),
  primary_muscle_ids: z.array(z.string().uuid()).default([]),
  secondary_muscle_ids: z.array(z.string().uuid()).default([]),
});

export type UpsertExerciseInput = z.infer<typeof upsertExerciseSchema>;

// ---------------------------------------------------------------------------
// Exercise list query
// ---------------------------------------------------------------------------

export const listAdminExercisesSchema = z.object({
  q: z.string().max(120).optional(),
  cursor: z.string().uuid().optional(),
});

export type ListAdminExercisesInput = z.infer<typeof listAdminExercisesSchema>;

// ---------------------------------------------------------------------------
// Media upload (validated client-side and enforced server-side)
// ---------------------------------------------------------------------------

export const ALLOWED_MEDIA_TYPES = ["image/gif", "video/mp4", "video/webm"] as const;
export const MAX_MEDIA_BYTES = 5 * 1024 * 1024; // 5 MB

export const mediaExtMap: Record<string, "gif" | "mp4" | "webm"> = {
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

// ---------------------------------------------------------------------------
// Admin user list query
// ---------------------------------------------------------------------------

export const listAdminUsersSchema = z.object({
  q: z.string().max(120).optional(),
});

export type ListAdminUsersInput = z.infer<typeof listAdminUsersSchema>;
