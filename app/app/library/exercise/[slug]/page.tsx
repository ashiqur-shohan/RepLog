import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExerciseMedia } from "@/components/domain/exercise/ExerciseMedia";
import { Badge } from "@/components/ui/badge";
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

  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 py-6 pb-32">
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

      <h1 className="text-3xl font-semibold tracking-tight mt-4">{ex.name}</h1>

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

      {ex.description && <p className="text-sm text-muted-foreground mt-4">{ex.description as string}</p>}

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

      <div className="fixed bottom-0 left-0 right-0 md:left-60 px-5 pb-5 pt-3 bg-gradient-to-t from-background to-transparent">
        <Link
          href={`/app/plans?addExercise=${ex.slug}`}
          className="block w-full text-center bg-primary text-primary-foreground py-3 rounded-md font-medium shadow-glow-primary"
        >
          Add to workout
        </Link>
      </div>
    </div>
  );
}
