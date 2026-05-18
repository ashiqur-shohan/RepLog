"use client";

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { addPlanDay, addPlanExercise, reorderPlanExercises } from "@/lib/actions/plans";
import type { LibraryExercise } from "@/lib/actions/exercises";
import { cn } from "@/lib/utils/cn";

type PlanDayExercise = {
  id: string;
  exercise_id: string;
  position: number;
  target_sets: number | null;
  target_reps_min: number | null;
  target_reps_max: number | null;
  target_rpe: number | null;
  rest_seconds: number | null;
  exercise: { id: string; name: string; slug: string; thumbnail_url: string | null } | null;
};

type PlanDay = {
  id: string;
  name: string;
  position: number;
  plan_day_exercises: PlanDayExercise[];
};

type Plan = {
  id: string;
  name: string;
  description: string | null;
  plan_days: PlanDay[];
};

type MuscleGroup = { id: string; slug: string; name: string };

export function PlanEditor({
  plan,
  muscleGroups,
  exercises,
}: {
  plan: Plan;
  muscleGroups: MuscleGroup[];
  exercises: LibraryExercise[];
}) {
  const sortedDays = [...plan.plan_days].sort((a, b) => a.position - b.position);
  const [activeDayId, setActiveDayId] = useState<string | null>(sortedDays[0]?.id ?? null);
  const [pickerOpen, setPickerOpen] = useState(true);

  const activeDay = sortedDays.find((d) => d.id === activeDayId);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-xs text-muted-foreground">Editing plan</div>
          <h1 className="text-xl font-semibold tracking-tight">{plan.name}</h1>
        </div>
        <AddDayButton planId={plan.id} nextDayNumber={(sortedDays.at(-1)?.position ?? 0) + 1} />
      </div>

      <div className="grid md:grid-cols-[1fr_320px] gap-6">
        <div>
          {sortedDays.length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              No days yet. Add your first day to start building the plan.
            </Card>
          ) : (
            <>
              <div className="flex gap-1 border-b border-border overflow-x-auto pb-px">
                {sortedDays.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setActiveDayId(d.id)}
                    className={cn(
                      "px-4 py-2 text-sm whitespace-nowrap border-b-2 -mb-px",
                      d.id === activeDayId
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Day {d.position} · {d.name}
                  </button>
                ))}
              </div>

              {activeDay && (
                <DayEditor day={activeDay} />
              )}
            </>
          )}
        </div>

        <aside className="md:sticky md:top-4 self-start">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-sm">Exercise picker</div>
              <Button variant="ghost" size="sm" onClick={() => setPickerOpen((o) => !o)}>
                {pickerOpen ? "Hide" : "Show"}
              </Button>
            </div>
            {pickerOpen && (
              <ExercisePicker
                muscleGroups={muscleGroups}
                exercises={exercises}
                onAdd={async (ex) => {
                  if (!activeDay) {
                    toast.error("Add a day first");
                    return;
                  }
                  const fd = new FormData();
                  fd.set("plan_day_id", activeDay.id);
                  fd.set("exercise_id", ex.id);
                  fd.set("position", String(activeDay.plan_day_exercises.length + 1));
                  const r = await addPlanExercise(fd);
                  if (!r.ok) toast.error(r.error);
                  else toast.success(`Added ${ex.name}`);
                }}
              />
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}

function AddDayButton({ planId, nextDayNumber }: { planId: string; nextDayNumber: number }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      onClick={() =>
        startTransition(async () => {
          const fd = new FormData();
          fd.set("plan_id", planId);
          fd.set("name", `Day ${nextDayNumber}`);
          fd.set("position", String(nextDayNumber));
          const r = await addPlanDay(fd);
          if (!r.ok) toast.error(r.error);
        })
      }
      disabled={pending}
    >
      <Plus className="size-4" /> Add day
    </Button>
  );
}

function DayEditor({ day }: { day: PlanDay }) {
  const sorted = [...day.plan_day_exercises].sort((a, b) => a.position - b.position);
  const [order, setOrder] = useState(sorted.map((e) => e.id));
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = order.indexOf(active.id as string);
    const newIndex = order.indexOf(over.id as string);
    const next = arrayMove(order, oldIndex, newIndex);
    setOrder(next);
    const r = await reorderPlanExercises({ plan_day_id: day.id, ordered_ids: next });
    if (!r.ok) toast.error("Could not reorder");
  }

  return (
    <div className="mt-5">
      <div className="grid grid-cols-[24px_1fr_72px_72px_72px_32px] gap-3 text-[10px] uppercase tracking-widest text-muted-foreground px-2 pb-1">
        <div></div>
        <div>Exercise</div>
        <div className="text-center">Sets</div>
        <div className="text-center">Reps</div>
        <div className="text-center">Rest</div>
        <div></div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {order
              .map((id) => sorted.find((e) => e.id === id))
              .filter((e): e is PlanDayExercise => !!e)
              .map((ex) => (
                <SortableRow key={ex.id} exercise={ex} />
              ))}
          </div>
        </SortableContext>
      </DndContext>

      {sorted.length === 0 && (
        <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No exercises in this day. Pick from the library on the right.
        </div>
      )}
    </div>
  );
}

function SortableRow({ exercise }: { exercise: PlanDayExercise }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: exercise.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-3 grid grid-cols-[24px_1fr_72px_72px_72px_32px] gap-3 items-center",
        isDragging && "opacity-60 shadow-glow-primary",
      )}
    >
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="text-sm font-medium truncate">{exercise.exercise?.name ?? "Exercise"}</div>
      <Input className="text-center font-mono text-sm py-1.5 h-9" defaultValue={exercise.target_sets ?? ""} placeholder="—" />
      <Input
        className="text-center font-mono text-sm py-1.5 h-9"
        defaultValue={
          exercise.target_reps_min || exercise.target_reps_max
            ? `${exercise.target_reps_min ?? ""}${exercise.target_reps_max ? `–${exercise.target_reps_max}` : ""}`
            : ""
        }
        placeholder="—"
      />
      <Input
        className="text-center font-mono text-sm py-1.5 h-9"
        defaultValue={exercise.rest_seconds ? `${exercise.rest_seconds}s` : ""}
        placeholder="—"
      />
      <button type="button" className="text-muted-foreground hover:text-destructive" aria-label="Remove exercise">
        <X className="size-4" />
      </button>
    </Card>
  );
}

function ExercisePicker({
  muscleGroups,
  exercises,
  onAdd,
}: {
  muscleGroups: MuscleGroup[];
  exercises: LibraryExercise[];
  onAdd: (ex: LibraryExercise) => void;
}) {
  const [filter, setFilter] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const filtered = exercises.filter((ex) => {
    if (filter && !ex.muscles.some((m) => m.slug === filter)) return false;
    if (q && !ex.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <Input
        placeholder="Search…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mb-2"
      />
      <div className="flex gap-1 overflow-x-auto pb-1 mb-2">
        <Badge
          variant={filter === null ? "default" : "secondary"}
          className="cursor-pointer"
          onClick={() => setFilter(null)}
        >
          All
        </Badge>
        {muscleGroups.map((m) => (
          <Badge
            key={m.id}
            variant={filter === m.slug ? "default" : "secondary"}
            className="cursor-pointer whitespace-nowrap"
            onClick={() => setFilter(m.slug)}
          >
            {m.name}
          </Badge>
        ))}
      </div>
      <div className="max-h-80 overflow-y-auto space-y-1">
        {filtered.slice(0, 30).map((ex) => {
          const primary = ex.muscles.find((m) => m.role === "primary")?.name ?? "—";
          return (
            <div key={ex.id} className="p-2 rounded-md hover:bg-muted flex items-center justify-between gap-2">
              <div>
                <div className="text-sm leading-tight">{ex.name}</div>
                <div className="text-[10px] text-muted-foreground">
                  {primary}
                  {ex.equipment?.name ? ` · ${ex.equipment.name}` : ""}
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => onAdd(ex)}>
                Add
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
