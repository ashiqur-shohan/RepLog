import { requireAdmin } from "@/lib/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { ExerciseForm } from "@/components/domain/admin/ExerciseForm";

export const metadata = { title: "New Exercise — replog Admin" };

type MuscleGroupRow = { id: string; name: string; display_order: number };
type EquipmentRow = { id: string; name: string; display_order: number };

export default async function NewExercisePage() {
  await requireAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const [muscleGroupsResult, equipmentResult] = await Promise.all([
    admin.from("muscle_groups").select("id, name, display_order").order("display_order") as Promise<{
      data: MuscleGroupRow[] | null;
    }>,
    admin.from("equipment").select("id, name, display_order").order("display_order") as Promise<{
      data: EquipmentRow[] | null;
    }>,
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">New Exercise</h1>
      <ExerciseForm
        muscleGroups={muscleGroupsResult.data ?? []}
        equipment={equipmentResult.data ?? []}
        initialValues={null}
      />
    </div>
  );
}
