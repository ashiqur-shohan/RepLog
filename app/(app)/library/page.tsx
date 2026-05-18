import Link from "next/link";
import { listMuscleGroups, listExercises } from "@/lib/actions/exercises";
import { Card } from "@/components/ui/card";

export default async function LibraryPage() {
  const [muscleGroups, allExercises] = await Promise.all([
    listMuscleGroups(),
    listExercises({ limit: 1000 }),
  ]);

  const counts = new Map<string, number>();
  for (const ex of allExercises) {
    for (const m of ex.muscles) {
      if (m.role === "primary") counts.set(m.slug, (counts.get(m.slug) ?? 0) + 1);
    }
  }

  return (
    <div className="px-5 md:px-8 py-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight">Library</h1>
      <p className="text-sm text-muted-foreground mt-1">Browse exercises by muscle group.</p>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {muscleGroups.map((mg) => (
          <Link
            key={mg.id}
            href={`/library/${mg.slug}`}
            className="aspect-[4/3] rounded-lg border border-border bg-card p-4 flex flex-col justify-between hover:border-primary/50 transition-colors"
          >
            <div className="text-xs uppercase tracking-widest text-muted-foreground">{mg.name}</div>
            <div className="flex items-end justify-between">
              <div className="font-mono text-3xl tabular-nums">{counts.get(mg.slug) ?? 0}</div>
              <div className="text-xs text-muted-foreground">exercises</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
