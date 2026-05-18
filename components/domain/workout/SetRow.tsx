"use client";

import { Check } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { logSet, updateSet } from "@/lib/actions/sessions";
import { useActiveWorkout } from "@/lib/stores/active-workout";
import { cn } from "@/lib/utils/cn";
import { fromKg, toKg, type WeightUnit } from "@/lib/utils/units";

interface Props {
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  defaultWeightKg: number | null;
  defaultReps: number | null;
  defaultRpe: number | null;
  existingId?: string;
  restSec: number;
  weightUnit: WeightUnit;
}

export function SetRow({
  sessionId,
  exerciseId,
  setNumber,
  defaultWeightKg,
  defaultReps,
  defaultRpe,
  existingId,
  restSec,
  weightUnit,
}: Props) {
  const startRest = useActiveWorkout((s) => s.startRest);
  const [weight, setWeight] = useState<string>(
    defaultWeightKg !== null ? String(Math.round(fromKg(defaultWeightKg, weightUnit) * 10) / 10) : "",
  );
  const [reps, setReps] = useState<string>(defaultReps !== null ? String(defaultReps) : "");
  const [rpe, setRpe] = useState<number | null>(defaultRpe);
  const [completed, setCompleted] = useState<boolean>(!!existingId);
  const [savedId, setSavedId] = useState<string | undefined>(existingId);
  const [pending, startTransition] = useTransition();

  function handleComplete() {
    const w = weight.trim() === "" ? null : Number(weight);
    const r = reps.trim() === "" ? null : Number(reps);
    if (w !== null && (Number.isNaN(w) || w < 0)) return toast.error("Invalid weight");
    if (r !== null && (Number.isNaN(r) || r < 0)) return toast.error("Invalid reps");

    const weightKg = w === null ? null : toKg(w, weightUnit);

    // Optimistic complete
    setCompleted(true);
    startRest(restSec);

    startTransition(async () => {
      if (savedId) {
        const res = await updateSet({
          id: savedId,
          session_id: sessionId,
          exercise_id: exerciseId,
          set_number: setNumber,
          weight_kg: weightKg,
          reps: r,
          rpe,
          is_warmup: false,
        });
        if (!res.ok) {
          toast.error(res.error);
          setCompleted(false);
        }
      } else {
        const res = await logSet({
          session_id: sessionId,
          exercise_id: exerciseId,
          set_number: setNumber,
          weight_kg: weightKg,
          reps: r,
          rpe,
          is_warmup: false,
        });
        if (!res.ok) {
          toast.error(res.error);
          setCompleted(false);
        } else {
          setSavedId(res.data.id);
        }
      }
    });
  }

  return (
    <div
      className={cn(
        "grid grid-cols-[32px_1fr_24px_1fr_56px_56px] gap-2 items-center h-14 px-1 rounded-md transition-colors",
        completed && "bg-muted/60",
        !completed && "border border-border bg-card",
      )}
    >
      <div className={cn("text-center font-mono text-sm tabular-nums", completed && "text-muted-foreground")}>
        {setNumber}
      </div>
      <input
        inputMode="decimal"
        type="text"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        disabled={completed}
        aria-label={`Set ${setNumber} weight`}
        className={cn(
          "text-center bg-transparent font-mono text-2xl tabular-nums focus:outline-none focus:ring-2 focus:ring-ring rounded",
          completed && "line-through decoration-1 text-foreground/80",
        )}
        placeholder="—"
      />
      <div className="text-center text-muted-foreground">×</div>
      <input
        inputMode="numeric"
        type="text"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        disabled={completed}
        aria-label={`Set ${setNumber} reps`}
        className={cn(
          "text-center bg-transparent font-mono text-2xl tabular-nums focus:outline-none focus:ring-2 focus:ring-ring rounded",
          completed && "line-through decoration-1 text-foreground/80",
        )}
        placeholder="—"
      />
      <RpeChip value={rpe} onChange={setRpe} disabled={completed} />
      <button
        type="button"
        onClick={handleComplete}
        disabled={pending || completed}
        aria-label={`Complete set ${setNumber}`}
        className={cn(
          "w-11 h-11 rounded-full grid place-items-center mx-auto",
          completed ? "bg-primary text-primary-foreground" : "border-2 border-primary text-primary",
        )}
      >
        <Check className="size-4" aria-hidden />
      </button>
    </div>
  );
}

function RpeChip({
  value,
  onChange,
  disabled,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={cn(
          "block mx-auto px-2 py-1 rounded text-xs font-mono tabular-nums",
          value !== null ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
        aria-label="RPE"
      >
        {value !== null ? value : "—"}
      </button>
      {open && (
        <div
          className="absolute z-20 right-0 mt-1 bg-card border border-border rounded-md shadow-lg p-2 grid grid-cols-3 gap-1 w-32"
          role="listbox"
        >
          {[6, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((n) => (
            <button
              key={n}
              type="button"
              className={cn(
                "text-xs font-mono py-1 rounded",
                value === n ? "bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
              onClick={() => {
                onChange(n);
                setOpen(false);
              }}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            className="col-span-3 text-[10px] text-muted-foreground py-1 hover:bg-muted rounded"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
