import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { ExerciseForm, type ExerciseFormInitialValues } from "@/components/domain/admin/ExerciseForm";

export const metadata = { title: "Edit Exercise — replog Admin" };

type RawExercise = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  instructions: string | null;
  difficulty: string;
  equipment_id: string | null;
  is_global: boolean;
  media_url: string | null;
  media_type: string | null;
  thumbnail_url: string | null;
  exercise_muscles: { role: string; muscle_group_id: string }[];
};

type MuscleGroupRow = { id: string; name: string; display_order: number };
type EquipmentRow = { id: string; name: string; display_order: number };

export default async function EditExercisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const [exerciseResult, muscleGroupsResult, equipmentResult] = await Promise.all([
    admin
      .from("exercises")
      .select(
        `id, name, slug, description, instructions, difficulty, equipment_id, is_global,
         media_url, media_type, thumbnail_url,
         exercise_muscles(role, muscle_group_id)`,
      )
      .eq("id", id)
      .is("deleted_at", null)
      .single() as Promise<{ data: RawExercise | null; error: { message: string } | null }>,
    admin
      .from("muscle_groups")
      .select("id, name, display_order")
      .order("display_order") as Promise<{ data: MuscleGroupRow[] | null }>,
    admin
      .from("equipment")
      .select("id, name, display_order")
      .order("display_order") as Promise<{ data: EquipmentRow[] | null }>,
  ]);

  if (exerciseResult.error || !exerciseResult.data) notFound();

  const ex = exerciseResult.data;

  const initialValues: ExerciseFormInitialValues = {
    id: ex.id,
    name: ex.name,
    slug: ex.slug,
    description: ex.description ?? "",
    instructions: ex.instructions ?? "",
    difficulty: ex.difficulty as "beginner" | "intermediate" | "advanced",
    equipment_id: ex.equipment_id ?? "",
    is_global: true,
    primary_muscle_ids: ex.exercise_muscles
      .filter((m) => m.role === "primary")
      .map((m) => m.muscle_group_id),
    secondary_muscle_ids: ex.exercise_muscles
      .filter((m) => m.role === "secondary")
      .map((m) => m.muscle_group_id),
    media_url: ex.media_url ?? null,
    media_type: (ex.media_type as "gif" | "mp4" | "webm" | null) ?? null,
    thumbnail_url: ex.thumbnail_url ?? null,
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Edit Exercise</h1>
      <ExerciseForm
        muscleGroups={muscleGroupsResult.data ?? []}
        equipment={equipmentResult.data ?? []}
        initialValues={initialValues}
      />
    </div>
  );
}
