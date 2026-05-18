import { notFound } from "next/navigation";
import { PlanEditor } from "@/components/domain/plan/PlanEditor";
import { listExercises, listMuscleGroups } from "@/lib/actions/exercises";
import { getPlan } from "@/lib/actions/plans";

export default async function EditPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [plan, muscleGroups, exercises] = await Promise.all([
    getPlan(id),
    listMuscleGroups(),
    listExercises({ limit: 500 }),
  ]);
  if (!plan) notFound();

  return (
    <div className="px-5 md:px-8 py-6 max-w-6xl mx-auto">
      <PlanEditor
        plan={plan as unknown as Parameters<typeof PlanEditor>[0]["plan"]}
        muscleGroups={muscleGroups as unknown as Parameters<typeof PlanEditor>[0]["muscleGroups"]}
        exercises={exercises}
      />
    </div>
  );
}
