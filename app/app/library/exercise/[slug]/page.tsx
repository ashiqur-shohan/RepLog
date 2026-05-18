import { Bookmark, ChevronLeft, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExerciseMedia } from "@/components/domain/exercise/ExerciseMedia";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getExerciseBySlug } from "@/lib/actions/exercises";

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ex = await getExerciseBySlug(slug);
  if (!ex) notFound();

  type Joined = {
    role: "primary" | "secondary";
    muscle: { name: string; slug: string } | { name: string; slug: string }[] | null;
  };
  const muscles = ((ex.exercise_muscles ?? []) as unknown as Joined[]).map((m) => ({
    role: m.role,
    name: Array.isArray(m.muscle) ? m.muscle[0]?.name : m.muscle?.name,
  }));
  const primary = muscles.filter((m) => m.role === "primary" && m.name).map((m) => m.name as string);
  const secondary = muscles.filter((m) => m.role === "secondary" && m.name).map((m) => m.name as string);
  const equipment = Array.isArray(ex.equipment) ? ex.equipment[0] : ex.equipment;

  const addHref = `/app/plans?addExercise=${ex.slug}` as const;

  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 py-6 max-md:pb-32">
      <Link
        href="/app/library"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden /> Library
      </Link>

      <ExerciseMedia
        mediaUrl={ex.media_url}
        mediaType={ex.media_type as "gif" | "mp4" | "webm" | null}
        thumbnailUrl={ex.thumbnail_url}
        name={ex.name}
        className="aspect-[16/9] rounded-lg mt-3"
        autoplay
      />

      {/* Title row — H1 on the left, primary + bookmark CTA cluster on the right (desktop) */}
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight">{ex.name}</h1>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {primary.map((p) => (
              <Badge key={p} variant="default">
                {p}
              </Badge>
            ))}
            {secondary.map((s) => (
              <Badge key={s} variant="secondary">
                {s}
              </Badge>
            ))}
            {equipment?.name && <Badge variant="outline">{equipment.name}</Badge>}
          </div>
        </div>

        {/* Desktop inline CTA — hidden on mobile */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <Button size="icon" variant="outline" aria-label="Bookmark exercise">
            <Bookmark />
          </Button>
          <Button size="lg" asChild>
            <Link href={addHref}>
              <Plus aria-hidden /> Add to workout
            </Link>
          </Button>
        </div>
      </div>

      {ex.description && (
        <p className="text-sm text-muted-foreground mt-4">{ex.description as string}</p>
      )}

      <Tabs defaultValue="instructions" className="mt-6">
        <TabsList>
          <TabsTrigger value="instructions">Instructions</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="records">Records</TabsTrigger>
        </TabsList>
        <TabsContent value="instructions" className="text-sm leading-relaxed space-y-2 text-muted-foreground">
          {ex.instructions ? (
            (ex.instructions as string)
              .split("\n")
              .filter(Boolean)
              .map((line: string, i: number) => <p key={i}>{line}</p>)
          ) : (
            <p>No instructions yet.</p>
          )}
          {ex.media_attribution && (
            <p className="text-[10px] mt-4">Media: {ex.media_attribution as string}</p>
          )}
        </TabsContent>
        <TabsContent value="history" className="text-sm text-muted-foreground">
          Your history for this exercise will appear here after you log sets.
        </TabsContent>
        <TabsContent value="records" className="text-sm text-muted-foreground">
          Your personal records for this exercise will appear here.
        </TabsContent>
      </Tabs>

      {/* Mobile-only sticky CTA — sits above the bottom tab nav, respects safe-area */}
      <div
        className="md:hidden fixed inset-x-0 px-5 pt-3 pb-3 bg-gradient-to-t from-background via-background/95 to-transparent"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 64px)" }}
      >
        <Button size="lg" className="w-full" asChild>
          <Link href={addHref}>
            <Plus aria-hidden /> Add to workout
          </Link>
        </Button>
      </div>
    </div>
  );
}
