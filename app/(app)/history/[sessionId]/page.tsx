import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { requireUser } from "@/lib/guards";
import { formatDuration } from "@/lib/utils/format";
import { formatWeight, volumeKg } from "@/lib/utils/units";

export const metadata = { title: "Session recap" };

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

// ── Local types ─────────────────────────────────────────────────────────
interface SessionSet {
  id: string;
  exercise_id: string;
  set_number: number;
  weight_kg: number | null;
  reps: number | null;
  rpe: number | null;
  is_warmup: boolean;
  notes: string | null;
  exercise: { id: string; name: string; slug: string } | null;
}

interface SessionData {
  id: string;
  name: string | null;
  started_at: string;
  finished_at: string | null;
  notes: string | null;
  plan_day: { id: string; name: string; plan: { name: string } | null } | null;
  session_sets: SessionSet[];
}
// ────────────────────────────────────────────────────────────────────────

export default async function SessionRecapPage({ params }: PageProps) {
  const { sessionId } = await params;
  const { user, supabase } = await requireUser();

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("weight_unit")
    .eq("id", user.id)
    .single();
  const weightUnit = ((profileRaw as { weight_unit: string } | null)?.weight_unit ?? "kg") as
    | "kg"
    | "lb";

  const { data: raw } = await supabase
    .from("workout_sessions")
    .select(
      `id, name, started_at, finished_at, notes,
       plan_day:plan_days(id, name, plan:workout_plans(name)),
       session_sets(id, exercise_id, set_number, weight_kg, reps, rpe, is_warmup, notes,
         exercise:exercises(id, name, slug))`,
    )
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!raw) notFound();

  const session = raw as unknown as SessionData;
  const sets = session.session_sets ?? [];

  // Group sets by exercise
  const exerciseMap = new Map<string, { name: string; sets: SessionSet[] }>();
  for (const s of sets) {
    const exId = s.exercise_id;
    const exName = s.exercise?.name ?? "Exercise";
    if (!exerciseMap.has(exId)) {
      exerciseMap.set(exId, { name: exName, sets: [] });
    }
    exerciseMap.get(exId)!.sets.push(s);
  }

  // Sort sets within each exercise by set_number
  for (const ex of exerciseMap.values()) {
    ex.sets.sort((a, b) => a.set_number - b.set_number);
  }

  const duration =
    session.finished_at && session.started_at
      ? Math.round(
          (new Date(session.finished_at).getTime() - new Date(session.started_at).getTime()) / 1000,
        )
      : 0;

  const totalVolume = sets
    .filter((s) => !s.is_warmup)
    .reduce((acc, s) => acc + volumeKg(s.weight_kg, s.reps), 0);

  const sessionName = session.name ?? session.plan_day?.name ?? "Workout";

  return (
    <div className="max-w-2xl mx-auto px-5 pt-6 pb-12">
      <Link
        href="/history"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ChevronLeft size={16} />
        History
      </Link>

      <h1 className="text-xl font-semibold">{sessionName}</h1>
      <div className="text-sm text-muted-foreground mt-0.5">
        {format(new Date(session.started_at), "EEEE, MMMM d, yyyy")}
      </div>

      {/* Summary strip */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="p-3 rounded-md bg-card border border-border">
          <div className="text-xs text-muted-foreground">Duration</div>
          <div className="font-mono text-lg mt-0.5">
            {duration > 0 ? formatDuration(duration) : "—"}
          </div>
        </div>
        <div className="p-3 rounded-md bg-card border border-border">
          <div className="text-xs text-muted-foreground">Volume</div>
          <div className="font-mono text-lg mt-0.5">
            {totalVolume > 0 ? formatWeight(totalVolume, weightUnit) : "—"}
          </div>
        </div>
        <div className="p-3 rounded-md bg-card border border-border">
          <div className="text-xs text-muted-foreground">Exercises</div>
          <div className="font-mono text-lg mt-0.5">{exerciseMap.size}</div>
        </div>
      </div>

      {/* Exercise breakdown */}
      <div className="mt-6 space-y-5">
        {Array.from(exerciseMap.values()).map(({ name, sets: exSets }) => (
          <div key={name} className="p-4 rounded-lg bg-card border border-border">
            <h2 className="text-sm font-medium mb-3">{name}</h2>
            <div className="space-y-1.5">
              {/* Header */}
              <div className="grid grid-cols-4 text-[10px] font-mono uppercase tracking-widest text-muted-foreground px-1">
                <span>Set</span>
                <span>Weight</span>
                <span>Reps</span>
                <span>RPE</span>
              </div>
              {exSets.map((s) => (
                <div
                  key={s.id}
                  className={`grid grid-cols-4 font-mono text-sm px-1 py-0.5 rounded ${
                    s.is_warmup ? "opacity-50" : ""
                  }`}
                >
                  <span className="text-muted-foreground">
                    {s.is_warmup ? "W" : s.set_number}
                  </span>
                  <span>
                    {s.weight_kg !== null ? formatWeight(s.weight_kg, weightUnit) : "BW"}
                  </span>
                  <span>{s.reps ?? "—"}</span>
                  <span className="text-muted-foreground">{s.rpe ?? "—"}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {session.notes && (
        <div className="mt-5 p-4 rounded-lg bg-card border border-border">
          <div className="text-xs text-muted-foreground uppercase tracking-widest font-mono mb-1">
            Notes
          </div>
          <p className="text-sm">{session.notes}</p>
        </div>
      )}
    </div>
  );
}
