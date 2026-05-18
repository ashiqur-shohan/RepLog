"use client";

import { useState, useTransition, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { upsertExercise, uploadExerciseMedia } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MuscleGroup = { id: string; name: string; display_order: number };
export type Equipment = { id: string; name: string; display_order: number };

export type ExerciseFormInitialValues = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  instructions: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  equipment_id: string;
  is_global: true;
  primary_muscle_ids: string[];
  secondary_muscle_ids: string[];
  media_url: string | null;
  media_type: "gif" | "mp4" | "webm" | null;
  thumbnail_url: string | null;
};

type Props = {
  muscleGroups: MuscleGroup[];
  equipment: Equipment[];
  initialValues: ExerciseFormInitialValues | null;
};

const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;

// ---------------------------------------------------------------------------
// Slug helper
// ---------------------------------------------------------------------------
function toSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ExerciseForm({ muscleGroups, equipment, initialValues }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [uploadPending, startUpload] = useTransition();

  const [name, setName] = useState(initialValues?.name ?? "");
  const [slug, setSlug] = useState(initialValues?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!initialValues?.slug);
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [instructions, setInstructions] = useState(initialValues?.instructions ?? "");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">(
    initialValues?.difficulty ?? "beginner",
  );
  const [equipmentId, setEquipmentId] = useState(initialValues?.equipment_id ?? "");
  const [primaryIds, setPrimaryIds] = useState<string[]>(
    initialValues?.primary_muscle_ids ?? [],
  );
  const [secondaryIds, setSecondaryIds] = useState<string[]>(
    initialValues?.secondary_muscle_ids ?? [],
  );

  // Media state
  const [mediaUrl, setMediaUrl] = useState<string | null>(initialValues?.media_url ?? null);
  const [mediaType, setMediaType] = useState<"gif" | "mp4" | "webm" | null>(
    initialValues?.media_type ?? null,
  );
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(
    initialValues?.thumbnail_url ?? null,
  );
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---------------------------------------------------------------------------
  // Name → auto-slug
  // ---------------------------------------------------------------------------
  function handleNameChange(val: string) {
    setName(val);
    if (!slugTouched) setSlug(toSlug(val));
  }

  // ---------------------------------------------------------------------------
  // Muscle chip toggles — a muscle can only be in one list at a time
  // ---------------------------------------------------------------------------
  function togglePrimary(id: string) {
    if (primaryIds.includes(id)) {
      setPrimaryIds((prev) => prev.filter((x) => x !== id));
    } else {
      // Remove from secondary if present
      setSecondaryIds((prev) => prev.filter((x) => x !== id));
      setPrimaryIds((prev) => [...prev, id]);
    }
  }

  function toggleSecondary(id: string) {
    if (secondaryIds.includes(id)) {
      setSecondaryIds((prev) => prev.filter((x) => x !== id));
    } else {
      // Remove from primary if present
      setPrimaryIds((prev) => prev.filter((x) => x !== id));
      setSecondaryIds((prev) => [...prev, id]);
    }
  }

  // ---------------------------------------------------------------------------
  // Media upload
  // ---------------------------------------------------------------------------
  const handleFile = useCallback(
    (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("slug", slug || toSlug(name));
      startUpload(async () => {
        const result = await uploadExerciseMedia(fd);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        setMediaUrl(result.data.media_url);
        setMediaType(result.data.media_type);
        setThumbnailUrl(result.data.thumbnail_url);
        toast.success("Media uploaded.");
      });
    },
    [slug, name],
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function clearMedia() {
    setMediaUrl(null);
    setMediaType(null);
    setThumbnailUrl(null);
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await upsertExercise({
        id: initialValues?.id,
        name,
        slug,
        description: description || null,
        instructions: instructions || null,
        difficulty,
        equipment_id: equipmentId || null,
        is_global: true,
        primary_muscle_ids: primaryIds,
        secondary_muscle_ids: secondaryIds,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(initialValues?.id ? "Exercise updated." : "Exercise created.");
      router.push("/app/admin/exercises");
    });
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Name + Slug */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            minLength={2}
            maxLength={120}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            required
            pattern="[a-z0-9-]+"
            title="Lowercase letters, numbers, hyphens only"
            className="mt-1 font-mono text-sm"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={2000}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          placeholder="Short description of the exercise…"
        />
      </div>

      {/* Instructions */}
      <div>
        <Label htmlFor="instructions">Instructions</Label>
        <textarea
          id="instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={5}
          maxLength={5000}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          placeholder="Step-by-step instructions…"
        />
      </div>

      {/* Difficulty segmented control */}
      <div>
        <Label>Difficulty</Label>
        <div className="mt-1 flex rounded-md border border-border overflow-hidden w-fit">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(d)}
              className={cn(
                "px-4 py-2 text-sm capitalize transition-colors",
                difficulty === d
                  ? "bg-primary text-primary-foreground font-medium"
                  : "bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Equipment */}
      <div>
        <Label htmlFor="equipment">Equipment</Label>
        <select
          id="equipment"
          value={equipmentId}
          onChange={(e) => setEquipmentId(e.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">None / bodyweight</option>
          {equipment.map((eq) => (
            <option key={eq.id} value={eq.id}>
              {eq.name}
            </option>
          ))}
        </select>
      </div>

      {/* Primary muscles */}
      <div>
        <Label>Primary Muscles</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {muscleGroups.map((mg) => {
            const selected = primaryIds.includes(mg.id);
            return (
              <button
                key={mg.id}
                type="button"
                onClick={() => togglePrimary(mg.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs border transition-colors",
                  selected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/60 hover:text-foreground",
                )}
              >
                {mg.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Secondary muscles */}
      <div>
        <Label>Secondary Muscles</Label>
        <p className="text-xs text-muted-foreground mt-0.5">
          A muscle can only be in one list at a time.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {muscleGroups.map((mg) => {
            const selected = secondaryIds.includes(mg.id);
            const isPrimary = primaryIds.includes(mg.id);
            return (
              <button
                key={mg.id}
                type="button"
                onClick={() => toggleSecondary(mg.id)}
                disabled={isPrimary}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs border transition-colors",
                  selected
                    ? "bg-muted text-foreground border-border"
                    : isPrimary
                      ? "opacity-30 cursor-not-allowed border-border text-muted-foreground"
                      : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground",
                )}
              >
                {mg.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Media upload */}
      <div>
        <Label>Media (GIF / MP4 / WebM, max 5 MB)</Label>
        {mediaUrl ? (
          <div className="mt-2 relative w-fit">
            {mediaType === "gif" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl} alt="Exercise preview" className="max-h-48 rounded-lg" />
            ) : (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video
                src={mediaUrl}
                autoPlay
                muted
                loop
                playsInline
                className="max-h-48 rounded-lg"
              />
            )}
            <button
              type="button"
              onClick={clearMedia}
              className="absolute top-1 right-1 rounded-full bg-background/80 p-1 hover:bg-background"
            >
              <X className="size-4" />
              <span className="sr-only">Remove media</span>
            </button>
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={cn(
              "mt-2 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors",
              dragOver
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/30",
              uploadPending && "opacity-50 pointer-events-none",
            )}
          >
            <Upload className="size-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {uploadPending ? "Uploading…" : "Drag & drop or click to upload"}
            </span>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/gif,video/mp4,video/webm"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending || uploadPending}>
          {pending
            ? "Saving…"
            : initialValues?.id
              ? "Save changes"
              : "Create exercise"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/app/admin/exercises")}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
