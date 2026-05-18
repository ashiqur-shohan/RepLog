import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExerciseTile } from "@/components/domain/exercise/ExerciseTile";
import { listExercises, listMuscleGroups } from "@/lib/actions/exercises";

export default async function MuscleGroupPage({
  params,
}: {
  params: Promise<{ muscleGroup: string }>;
}) {
  const { muscleGroup } = await params;
  const [muscleGroups, exercises] = await Promise.all([
    listMuscleGroups(),
    listExercises({ muscleGroupSlug: muscleGroup, limit: 200 }),
  ]);
  const mg = muscleGroups.find((m) => m.slug === muscleGroup);
  if (!mg) notFound();

  return (
    <div className="px-5 md:px-8 py-6 max-w-5xl mx-auto">
      <Link
        href="/library"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden /> Library
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight mt-2">
        {mg.name}{" "}
        <span className="text-muted-foreground font-mono text-base tabular-nums">
          ({exercises.length})
        </span>
      </h1>

      <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
        {exercises.map((ex) => (
          <ExerciseTile key={ex.id} exercise={ex} />
        ))}
      </div>

      {exercises.length === 0 && (
        <div className="text-sm text-muted-foreground mt-6">
          No exercises here yet. Check back soon.
        </div>
      )}
    </div>
  );
}
