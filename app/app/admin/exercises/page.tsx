import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { requireAdmin } from "@/lib/guards";
import { listAdminExercises } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteExerciseButton } from "./DeleteExerciseButton";

export const metadata = { title: "Admin · Exercises — replog" };

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "text-green-400",
  intermediate: "text-yellow-400",
  advanced: "text-red-400",
};

export default async function AdminExercisesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";

  const result = await listAdminExercises({ q: q || undefined });
  const exercises = result.ok ? result.data.exercises : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Exercises</h1>
        <Button asChild size="sm">
          <Link href="/app/admin/exercises/new">
            <Plus className="size-4" />
            New exercise
          </Link>
        </Button>
      </div>

      {/* Search */}
      <form className="max-w-sm">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search exercises…"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </form>

      {/* Desktop table */}
      <div className="hidden md:block rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Exercise</th>
              <th className="px-4 py-3 text-left font-medium">Primary muscles</th>
              <th className="px-4 py-3 text-left font-medium">Difficulty</th>
              <th className="px-4 py-3 text-left font-medium">Equipment</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {exercises.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No exercises found.
                </td>
              </tr>
            )}
            {exercises.map((ex) => (
              <tr key={ex.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {ex.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ex.thumbnail_url}
                        alt=""
                        className="size-10 rounded object-cover shrink-0"
                      />
                    ) : (
                      <div className="size-10 rounded bg-muted shrink-0" />
                    )}
                    <div>
                      <div className="font-medium">{ex.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{ex.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {ex.primary_muscles.map((m) => (
                      <Badge key={m.id} variant="secondary" className="text-[10px]">
                        {m.name}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={DIFFICULTY_COLORS[ex.difficulty] ?? ""}>
                    {ex.difficulty}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {ex.equipment?.name ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button asChild variant="ghost" size="icon">
                      <Link href={`/app/admin/exercises/${ex.id}/edit`}>
                        <Pencil className="size-4" />
                        <span className="sr-only">Edit {ex.name}</span>
                      </Link>
                    </Button>
                    <DeleteExerciseButton id={ex.id} name={ex.name} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {exercises.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No exercises found.</p>
        )}
        {exercises.map((ex) => (
          <div
            key={ex.id}
            className="rounded-lg border border-border bg-card p-4 flex items-start gap-3"
          >
            {ex.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ex.thumbnail_url}
                alt=""
                className="size-12 rounded object-cover shrink-0"
              />
            ) : (
              <div className="size-12 rounded bg-muted shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{ex.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {ex.difficulty} · {ex.equipment?.name ?? "no equipment"}
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {ex.primary_muscles.map((m) => (
                  <Badge key={m.id} variant="secondary" className="text-[10px]">
                    {m.name}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button asChild variant="ghost" size="icon">
                <Link href={`/app/admin/exercises/${ex.id}/edit`}>
                  <Pencil className="size-4" />
                  <span className="sr-only">Edit</span>
                </Link>
              </Button>
              <DeleteExerciseButton id={ex.id} name={ex.name} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
