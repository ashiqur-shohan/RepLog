import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { getISOWeek, startOfISOWeek, format } from "date-fns";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { requireUser } from "@/lib/guards";
import { getHistory } from "@/lib/actions/sessions";
import { formatDuration } from "@/lib/utils/format";
import { volumeKg } from "@/lib/utils/units";

export const metadata = { title: "History" };

// ── Local types (mirrors getHistory return shape) ──────────────────────────
interface SessionSet {
  id: string;
  exercise_id: string;
  set_number: number;
  weight_kg: number | null;
  reps: number | null;
  rpe: number | null;
  is_warmup: boolean;
  exercise: { id: string; name: string; slug: string } | null;
}

interface Session {
  id: string;
  name: string | null;
  started_at: string;
  finished_at: string | null;
  notes: string | null;
  plan_day: { id: string; name: string; plan: { name: string } | null } | null;
  session_sets: SessionSet[];
}

// Cast helper: getHistory return type is `never` until DB types are generated
type HistorySessions = Session[];

// ──────────────────────────────────────────────────────────────────────────

function getSessionDuration(session: Session): number {
  if (!session.finished_at || !session.started_at) return 0;
  return Math.round(
    (new Date(session.finished_at).getTime() - new Date(session.started_at).getTime()) / 1000,
  );
}

function getSessionVolume(session: Session): number {
  return (session.session_sets ?? []).reduce(
    (acc, s) => acc + volumeKg(s.weight_kg, s.reps),
    0,
  );
}

function getSessionStats(session: Session) {
  const sets = session.session_sets ?? [];
  const exerciseIds = new Set(sets.map((s) => s.exercise_id));
  return {
    exerciseCount: exerciseIds.size,
    setCount: sets.filter((s) => !s.is_warmup).length,
    volumeKg: getSessionVolume(session),
  };
}

interface WeekGroup {
  weekLabel: string;
  weekStart: Date;
  weekKey: string;
  sessions: Session[];
  totalVolume: number;
}

function groupByWeek(sessions: Session[]): WeekGroup[] {
  const map = new Map<string, WeekGroup>();
  const now = new Date();
  const currentWeek = getISOWeek(now);
  const currentYear = now.getFullYear();

  for (const session of sessions) {
    const date = new Date(session.started_at);
    const ws = startOfISOWeek(date);
    const week = getISOWeek(date);
    const year = date.getFullYear();
    const key = `${year}-W${week}`;

    let weekLabel: string;
    if (week === currentWeek && year === currentYear) {
      weekLabel = "This week";
    } else if (
      (week === currentWeek - 1 && year === currentYear) ||
      (currentWeek === 1 && week === 52 && year === currentYear - 1)
    ) {
      weekLabel = "Last week";
    } else {
      weekLabel = format(ws, "MMMM d, yyyy");
    }

    if (!map.has(key)) {
      map.set(key, { weekLabel, weekStart: ws, weekKey: key, sessions: [], totalVolume: 0 });
    }
    const group = map.get(key)!;
    group.sessions.push(session);
    group.totalVolume += getSessionVolume(session);
  }

  return Array.from(map.values()).sort(
    (a, b) => b.weekStart.getTime() - a.weekStart.getTime(),
  );
}

function getDayOfWeek(dateStr: string): string {
  return format(new Date(dateStr), "EEE");
}

function SessionCard({ session, weightUnit }: { session: Session; weightUnit: string }) {
  const duration = getSessionDuration(session);
  const stats = getSessionStats(session);
  const sets = session.session_sets ?? [];

  // Up to 3 highlighted set chips — working sets sorted by volume descending
  const highlightSets = sets
    .filter((s) => !s.is_warmup && s.weight_kg !== null && s.reps !== null)
    .sort((a, b) => volumeKg(b.weight_kg, b.reps) - volumeKg(a.weight_kg, a.reps))
    .slice(0, 3);

  const sessionName =
    session.name ?? session.plan_day?.name ?? session.plan_day?.plan?.name ?? "Workout";
  const day = getDayOfWeek(session.started_at);

  return (
    <Link
      href={`/history/${session.id}`}
      className="block p-3 rounded-md bg-card border border-border hover:border-muted-foreground/40 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium truncate pr-2">{sessionName}</div>
        <div className="font-mono text-xs text-muted-foreground shrink-0">
          {day} · {duration > 0 ? formatDuration(duration) : "—"}
        </div>
      </div>
      {(stats.exerciseCount > 0 || stats.setCount > 0 || stats.volumeKg > 0) && (
        <div className="font-mono text-xs text-muted-foreground mt-1">
          {stats.exerciseCount} exercise{stats.exerciseCount !== 1 ? "s" : ""} · {stats.setCount}{" "}
          set{stats.setCount !== 1 ? "s" : ""} ·{" "}
          {stats.volumeKg > 0
            ? `${Math.round(stats.volumeKg).toLocaleString()} ${weightUnit}`
            : "—"}
        </div>
      )}
      {highlightSets.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {highlightSets.map((s) => {
            const exerciseName = s.exercise?.name ?? "Exercise";
            const label = `${exerciseName} ${s.weight_kg}×${s.reps}`;
            return (
              <span key={s.id} className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted">
                {label}
              </span>
            );
          })}
        </div>
      )}
    </Link>
  );
}

export default async function HistoryPage() {
  const { user, supabase } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("weight_unit")
    .eq("id", user.id)
    .single();

  const weightUnit = (profile as { weight_unit: string } | null)?.weight_unit ?? "kg";

  // Cast to our local type since DB types stub returns never[]
  const rawSessions = await getHistory({ limit: 60 });
  const sessions = rawSessions as unknown as HistorySessions;
  const weeks = groupByWeek(sessions);

  return (
    <div className="max-w-2xl mx-auto px-5 pt-6 pb-12">
      <PageHeader title="History" />

      {sessions.length === 0 ? (
        <EmptyState
          icon={<Dumbbell size={24} />}
          title="Your first workout starts here"
          description="Sessions you complete will appear here, grouped by week."
          action={
            <Link
              href="/workout/new"
              className="inline-flex items-center justify-center h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-glow-primary"
            >
              Start a workout
            </Link>
          }
          className="mt-12"
        />
      ) : (
        <div className="mt-6 space-y-8">
          {weeks.map((week) => (
            <section key={week.weekKey}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  {week.weekLabel}
                </div>
                <div className="font-mono text-xs text-muted-foreground">
                  {week.totalVolume > 0
                    ? `${Math.round(week.totalVolume).toLocaleString()} ${weightUnit} total`
                    : null}
                </div>
              </div>
              <div className="space-y-2">
                {week.sessions.map((session) => (
                  <SessionCard key={session.id} session={session} weightUnit={weightUnit} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
