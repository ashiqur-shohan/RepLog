"use server";

import { requireUser } from "@/lib/guards";

export type LibraryExercise = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  difficulty: "beginner" | "intermediate" | "advanced";
  is_global: boolean;
  thumbnail_url: string | null;
  media_url: string | null;
  media_type: "gif" | "mp4" | "webm" | null;
  equipment: { name: string; slug: string } | null;
  muscles: Array<{ name: string; slug: string; role: "primary" | "secondary" }>;
};

export async function listMuscleGroups() {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("muscle_groups")
    .select("id, name, slug, sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listExercises(params: {
  muscleGroupSlug?: string;
  q?: string;
  equipmentSlug?: string;
  limit?: number;
}) {
  const { supabase } = await requireUser();
  let query = supabase
    .from("exercises")
    .select(
      `id, name, slug, description, difficulty, is_global, thumbnail_url, media_url, media_type,
       equipment:equipment(name, slug),
       exercise_muscles(role, muscle:muscle_groups(name, slug))`,
    )
    .is("deleted_at", null)
    .order("name", { ascending: true })
    .limit(params.limit ?? 60);

  if (params.q && params.q.trim()) {
    query = query.ilike("name", `%${params.q.trim()}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  type JoinedMuscle = {
    role: "primary" | "secondary";
    muscle: { name: string; slug: string } | { name: string; slug: string }[] | null;
  };
  let result = (data ?? []).map((e: Record<string, unknown>) => {
    const exMuscles = (e.exercise_muscles as JoinedMuscle[] | null) ?? [];
    const equipment = Array.isArray(e.equipment) ? e.equipment[0] : e.equipment;
    return {
      ...e,
      equipment,
      muscles: exMuscles.map((m) => {
        const muscle = Array.isArray(m.muscle) ? m.muscle[0] : m.muscle;
        return { name: muscle?.name ?? "", slug: muscle?.slug ?? "", role: m.role };
      }),
    };
  }) as unknown as LibraryExercise[];

  if (params.muscleGroupSlug) {
    result = result.filter((e) => e.muscles.some((m) => m.slug === params.muscleGroupSlug));
  }
  if (params.equipmentSlug) {
    result = result.filter((e) => e.equipment?.slug === params.equipmentSlug);
  }
  return result;
}

export async function getExerciseBySlug(slug: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("exercises")
    .select(
      `id, name, slug, description, instructions, difficulty, is_global,
       thumbnail_url, media_url, media_type, media_attribution,
       equipment:equipment(name, slug),
       exercise_muscles(role, muscle:muscle_groups(name, slug))`,
    )
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) return null;
  return data;
}
