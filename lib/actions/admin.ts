"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { actionErr, actionOk, type ActionResult } from "@/lib/actions/types";
import {
  upsertExerciseSchema,
  listAdminExercisesSchema,
  listAdminUsersSchema,
  ALLOWED_MEDIA_TYPES,
  MAX_MEDIA_BYTES,
  mediaExtMap,
  type UpsertExerciseInput,
} from "@/lib/validators/admin";

const PAGE_SIZE = 30;

// ---------------------------------------------------------------------------
// Supabase any-cast helper
// database.types.ts is a stub until migrations run + types are regenerated.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

// ---------------------------------------------------------------------------
// listAdminExercises
// ---------------------------------------------------------------------------

export type AdminExerciseRow = {
  id: string;
  name: string;
  slug: string;
  difficulty: string;
  is_global: boolean;
  thumbnail_url: string | null;
  media_type: string | null;
  equipment: { id: string; name: string } | null;
  primary_muscles: { id: string; name: string }[];
  secondary_muscles: { id: string; name: string }[];
};

type RawExerciseRow = {
  id: string;
  name: string;
  slug: string;
  difficulty: string;
  is_global: boolean;
  thumbnail_url: string | null;
  media_type: string | null;
  equipment: { id: string; name: string } | null;
  exercise_muscles: { role: string; muscle_group: { id: string; name: string } | null }[];
};

export async function listAdminExercises(input: { q?: string; cursor?: string }): Promise<
  ActionResult<{ exercises: AdminExerciseRow[]; nextCursor: string | null }>
> {
  await requireAdmin();
  const parsed = listAdminExercisesSchema.safeParse(input);
  if (!parsed.success) return actionErr("Invalid query");

  const { q, cursor } = parsed.data;
  const admin = createAdminClient() as AnyClient;

  let query = admin
    .from("exercises")
    .select(
      `id, name, slug, difficulty, is_global, thumbnail_url, media_type,
       equipment:equipment_id(id, name),
       exercise_muscles(role, muscle_group:muscle_group_id(id, name))`,
    )
    .is("deleted_at", null)
    .order("name", { ascending: true })
    .limit(PAGE_SIZE + 1);

  if (q) query = query.ilike("name", `%${q}%`);
  if (cursor) query = query.gt("id", cursor);

  const { data, error } = await query as { data: RawExerciseRow[] | null; error: { message: string } | null };
  if (error) return actionErr(error.message);

  const rows = data ?? [];
  const hasMore = rows.length > PAGE_SIZE;
  const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const nextCursor = hasMore ? (page[PAGE_SIZE - 1]?.id ?? null) : null;

  const exercises: AdminExerciseRow[] = page.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    difficulty: r.difficulty,
    is_global: r.is_global,
    thumbnail_url: r.thumbnail_url,
    media_type: r.media_type,
    equipment: r.equipment ?? null,
    primary_muscles: r.exercise_muscles
      .filter((m) => m.role === "primary" && m.muscle_group)
      .map((m) => m.muscle_group as { id: string; name: string }),
    secondary_muscles: r.exercise_muscles
      .filter((m) => m.role === "secondary" && m.muscle_group)
      .map((m) => m.muscle_group as { id: string; name: string }),
  }));

  return actionOk({ exercises, nextCursor });
}

// ---------------------------------------------------------------------------
// upsertExercise
// ---------------------------------------------------------------------------

export async function upsertExercise(
  input: UpsertExerciseInput,
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = upsertExerciseSchema.safeParse(input);
  if (!parsed.success) return actionErr("Invalid input", parsed.error.flatten().fieldErrors);

  const { id, primary_muscle_ids, secondary_muscle_ids, ...fields } = parsed.data;
  const admin = createAdminClient() as AnyClient;

  const exercisePayload = {
    ...fields,
    description: fields.description ?? null,
    instructions: fields.instructions ?? null,
    equipment_id: fields.equipment_id ?? null,
    created_by: null, // global exercises have no creator
  };

  let exerciseId: string;

  if (id) {
    const { data, error } = await admin
      .from("exercises")
      .update(exercisePayload)
      .eq("id", id)
      .select("id")
      .single() as { data: { id: string } | null; error: { message: string } | null };
    if (error || !data) return actionErr(error?.message ?? "Update failed");
    exerciseId = data.id;
  } else {
    const { data, error } = await admin
      .from("exercises")
      .insert(exercisePayload)
      .select("id")
      .single() as { data: { id: string } | null; error: { message: string } | null };
    if (error || !data) return actionErr(error?.message ?? "Insert failed");
    exerciseId = data.id;
  }

  // Replace muscle mappings: delete old, insert new
  const { error: delErr } = await admin
    .from("exercise_muscles")
    .delete()
    .eq("exercise_id", exerciseId) as { error: { message: string } | null };
  if (delErr) return actionErr(delErr.message);

  const muscleRows = [
    ...primary_muscle_ids.map((mid) => ({
      exercise_id: exerciseId,
      muscle_group_id: mid,
      role: "primary" as const,
    })),
    ...secondary_muscle_ids.map((mid) => ({
      exercise_id: exerciseId,
      muscle_group_id: mid,
      role: "secondary" as const,
    })),
  ];

  if (muscleRows.length > 0) {
    const { error: insErr } = await admin
      .from("exercise_muscles")
      .insert(muscleRows) as { error: { message: string } | null };
    if (insErr) return actionErr(insErr.message);
  }

  revalidatePath("/app/admin/exercises");
  return actionOk({ id: exerciseId });
}

// ---------------------------------------------------------------------------
// uploadExerciseMedia
// ---------------------------------------------------------------------------

export type MediaUploadResult = {
  media_url: string;
  media_type: "gif" | "mp4" | "webm";
  thumbnail_url: string | null;
};

export async function uploadExerciseMedia(
  formData: FormData,
): Promise<ActionResult<MediaUploadResult>> {
  await requireAdmin();

  const file = formData.get("file");
  const slug = formData.get("slug");

  if (!(file instanceof File)) return actionErr("No file provided");
  if (typeof slug !== "string" || !slug) return actionErr("No slug provided");

  if (file.size > MAX_MEDIA_BYTES) {
    return actionErr("File too large. Maximum size is 5 MB.");
  }

  const mimeType = file.type as (typeof ALLOWED_MEDIA_TYPES)[number];
  if (!(ALLOWED_MEDIA_TYPES as readonly string[]).includes(mimeType)) {
    return actionErr("Only GIF, MP4, and WebM files are allowed.");
  }

  const ext = mediaExtMap[mimeType];
  if (!ext) return actionErr("Unsupported file type");

  const path = `exercises/${slug}.${ext}`;
  const admin = createAdminClient();

  const { error: uploadError } = await admin.storage
    .from("exercise-media")
    .upload(path, file, { contentType: mimeType, upsert: true });

  if (uploadError) return actionErr(uploadError.message);

  const { data: urlData } = admin.storage.from("exercise-media").getPublicUrl(path);
  const media_url = urlData.publicUrl;
  const thumbnail_url = ext === "gif" ? media_url : null;

  return actionOk({ media_url, media_type: ext, thumbnail_url });
}

// ---------------------------------------------------------------------------
// deleteExercise (soft-delete)
// ---------------------------------------------------------------------------

export async function deleteExercise(id: string): Promise<ActionResult<void>> {
  await requireAdmin();
  const admin = createAdminClient() as AnyClient;

  const { error } = await admin
    .from("exercises")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id) as { error: { message: string } | null };

  if (error) return actionErr(error.message);
  revalidatePath("/app/admin/exercises");
  return actionOk(undefined);
}

// ---------------------------------------------------------------------------
// listAdminUsers
// ---------------------------------------------------------------------------

export type AdminUserRow = {
  id: string;
  email: string;
  tier: string;
  last_sign_in_at: string | null;
};

type SubRow = { user_id: string; tier: string };

export async function listAdminUsers(input: { q?: string }): Promise<
  ActionResult<{ users: AdminUserRow[] }>
> {
  await requireAdmin();
  const parsed = listAdminUsersSchema.safeParse(input);
  if (!parsed.success) return actionErr("Invalid query");

  const { q } = parsed.data;
  const admin = createAdminClient();

  const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({
    perPage: 100,
  });

  if (usersError) return actionErr(usersError.message);

  let authUsers = usersData.users;
  if (q) {
    const lower = q.toLowerCase();
    authUsers = authUsers.filter((u) => u.email?.toLowerCase().includes(lower));
  }

  const userIds = authUsers.map((u) => u.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: subs } = await (admin as any)
    .from("subscriptions")
    .select("user_id, tier")
    .in("user_id", userIds) as { data: SubRow[] | null };

  const tierMap = new Map<string, string>(
    (subs ?? []).map((s) => [s.user_id, s.tier]),
  );

  const users: AdminUserRow[] = authUsers.map((u) => ({
    id: u.id,
    email: u.email ?? "(no email)",
    tier: tierMap.get(u.id) ?? "free",
    last_sign_in_at: u.last_sign_in_at ?? null,
  }));

  return actionOk({ users });
}
