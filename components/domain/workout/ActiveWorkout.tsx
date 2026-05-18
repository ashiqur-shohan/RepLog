"use client";

import { ChevronLeft, MoreVertical, Replace } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { finishSession } from "@/lib/actions/sessions";
import { useActiveWorkout } from "@/lib/stores/active-workout";
import type { WeightUnit } from "@/lib/utils/units";
import { RestTimerBar } from "./RestTimerBar";
import { SetRow } from "./SetRow";

interface PlanExercise {
  id: string;
  exercise_id: string;
  position: number;
  target_sets: number | null;
  target_reps_min: number | null;
  target_reps_max: number | null;
  target_rpe: number | null;
  rest_seconds: number | null;
  exercise: {
    id: string;
    name: string;
    slug: string;
    thumbnail_url: string | null;
    media_url: string | null;
    media_type: "gif" | "mp4" | "webm" | null;
  };
}

interface SessionData {
  id: string;
  started_at: string;
  plan_day:
    | {
        id: string;
        name: string;
        position: number;
        plan: { name: string } | null;
        plan_day_exercises: PlanExercise[];
      }
    | null;
  session_sets: Array<{
    id: string;
    exercise_id: string;
    set_number: number;
    weight_kg: number | null;
    reps: number | null;
    rpe: number | null;
    is_warmup: boolean;
    exercise: { id: string; name: string; slug: string } | null;
  }>;
}

export function ActiveWorkout({ session, weightUnit }: { session: SessionData; weightUnit: WeightUnit }) {
  const router = useRouter();
  const store = useActiveWorkout();
  const [finishOpen, setFinishOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const planExercises = useMemo<PlanExercise[]>(() => {
    return (session.plan_day?.plan_day_exercises ?? []).sort((a, b) => a.position - b.position);
  }, [session.plan_day]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const current = planExercises[currentIdx];

  // Sync session id into store on mount
  useEffect(() => {
    if (store.sessionId !== session.id) store.startWorkout(session.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id]);

  const [duration, setDuration] = useState(0);
  useEffect(() => {
    const startedAt = new Date(session.started_at).getTime();
    const tick = () => setDuration(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [session.started_at]);

  function finish() {
    startTransition(async () => {
      const r = await finishSession({ session_id: session.id });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      store.endWorkout();
      toast.success("Session saved");
      router.replace(`/history/${session.id}`);
    });
  }

  const mm = String(Math.floor(duration / 60)).padStart(2, "0");
  const ss = String(duration % 60).padStart(2, "0");

  return (
    <div className="min-h-dvh pb-32">
      <header className="px-4 pt-3 pb-3 flex items-center justify-between safe-top">
        <Link
          href="/dashboard"
          aria-label="Close workout"
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <div className="text-center">
          {planExercises.length > 0 && (
            <div className="text-xs text-muted-foreground font-mono tabular-nums">
              Exercise {Math.min(currentIdx + 1, planExercises.length)} of {planExercises.length}
            </div>
          )}
          <div className="text-sm font-medium">
            {session.plan_day?.plan?.name
              ? `${session.plan_day.plan.name} · ${session.plan_day.name}`
              : "Freestyle workout"}
          </div>
        </div>
        <button
          type="button"
          aria-label="Workout options"
          className="text-muted-foreground hover:text-foreground"
        >
          <MoreVertical className="size-5" />
        </button>
      </header>

      <div className="px-4 mt-1 flex items-center justify-between text-xs">
        <span className="font-mono tabular-nums">
          ⏱ {mm}:{ss}
        </span>
        {planExercises.length > 0 && (
          <div className="flex-1 mx-3 h-1 bg-muted rounded">
            <div
              className="h-1 bg-primary rounded transition-[width]"
              style={{ width: `${((currentIdx + 1) / planExercises.length) * 100}%` }}
            />
          </div>
        )}
      </div>

      {current ? (
        <ExerciseBlock
          key={current.id}
          planExercise={current}
          sessionId={session.id}
          previousSets={session.session_sets.filter((s) => s.exercise_id === current.exercise_id)}
          weightUnit={weightUnit}
          isLast={currentIdx === planExercises.length - 1}
          onNext={() => setCurrentIdx((i) => Math.min(i + 1, planExercises.length - 1))}
          onFinish={() => setFinishOpen(true)}
        />
      ) : (
        <div className="px-5 mt-8">
          <p className="text-sm text-muted-foreground">
            Freestyle session — add exercises by tapping below.
          </p>
          <Button className="w-full mt-6" onClick={() => setFinishOpen(true)}>
            Finish workout
          </Button>
        </div>
      )}

      <RestTimerBar />

      <Dialog open={finishOpen} onOpenChange={setFinishOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finish workout?</DialogTitle>
            <DialogDescription>
              We'll save your sets and compute any new personal records.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setFinishOpen(false)}>
              Keep going
            </Button>
            <Button onClick={finish} disabled={pending}>
              {pending ? "Saving…" : "Finish"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ExerciseBlock({
  planExercise,
  sessionId,
  previousSets,
  weightUnit,
  isLast,
  onNext,
  onFinish,
}: {
  planExercise: PlanExercise;
  sessionId: string;
  previousSets: SessionData["session_sets"];
  weightUnit: WeightUnit;
  isLast: boolean;
  onNext: () => void;
  onFinish: () => void;
}) {
  const targetSets = planExercise.target_sets ?? 3;
  const restSec = planExercise.rest_seconds ?? 90;

  return (
    <div className="px-4 mt-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{planExercise.exercise.name}</h1>
        <button
          type="button"
          className="w-8 h-8 rounded-md bg-muted grid place-items-center"
          aria-label="Swap exercise"
        >
          <Replace className="size-4" />
        </button>
      </div>
      <div className="text-xs text-muted-foreground font-mono tabular-nums mt-1">
        Target · {targetSets} sets ·{" "}
        {planExercise.target_reps_min && planExercise.target_reps_max
          ? `${planExercise.target_reps_min}–${planExercise.target_reps_max} reps`
          : planExercise.target_reps_min
            ? `${planExercise.target_reps_min} reps`
            : "any reps"}
      </div>

      <div className="mt-5 grid grid-cols-[32px_1fr_24px_1fr_56px_56px] gap-2 items-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground px-1">
        <div className="text-center">Set</div>
        <div className="text-center">Weight</div>
        <div></div>
        <div className="text-center">Reps</div>
        <div className="text-center">RPE</div>
        <div className="text-center">Done</div>
      </div>

      <div className="space-y-2 mt-2">
        {Array.from({ length: targetSets }).map((_, i) => {
          const setNumber = i + 1;
          const existing = previousSets.find((s) => s.set_number === setNumber);
          return (
            <SetRow
              key={`${planExercise.id}-${setNumber}`}
              sessionId={sessionId}
              exerciseId={planExercise.exercise_id}
              setNumber={setNumber}
              defaultWeightKg={existing?.weight_kg ?? null}
              defaultReps={existing?.reps ?? planExercise.target_reps_min ?? null}
              defaultRpe={existing?.rpe ?? null}
              existingId={existing?.id}
              restSec={restSec}
              weightUnit={weightUnit}
            />
          );
        })}
      </div>

      <Button
        onClick={isLast ? onFinish : onNext}
        variant={isLast ? "default" : "outline"}
        className="w-full mt-6"
      >
        {isLast ? "Finish workout →" : "Next exercise →"}
      </Button>
    </div>
  );
}
