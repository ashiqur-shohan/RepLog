import Link from "next/link";
import type { LibraryExercise } from "@/lib/actions/exercises";
import { ExerciseMedia } from "./ExerciseMedia";

export function ExerciseTile({ exercise }: { exercise: LibraryExercise }) {
  const primary = exercise.muscles.find((m) => m.role === "primary")?.name ?? "—";
  return (
    <Link
      href={`/app/library/exercise/${exercise.slug}`}
      className="rounded-lg border border-border overflow-hidden bg-card hover:border-primary/50 transition-colors block"
    >
      <ExerciseMedia
        mediaUrl={exercise.media_url}
        mediaType={exercise.media_type}
        thumbnailUrl={exercise.thumbnail_url}
        name={exercise.name}
        className="aspect-[16/9]"
        autoplay={false}
      />
      <div className="p-2.5">
        <div className="text-sm font-medium leading-snug line-clamp-2">{exercise.name}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">
          {primary}
          {exercise.equipment?.name ? ` · ${exercise.equipment.name}` : ""}
        </div>
      </div>
    </Link>
  );
}
