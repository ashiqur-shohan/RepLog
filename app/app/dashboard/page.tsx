import { ChevronRight, Flame } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/guards";
import { getDashboardSummary } from "@/lib/actions/sessions";
import { formatWeight, type WeightUnit } from "@/lib/utils/units";

export default async function DashboardPage() {
  const { user, supabase } = await requireUser();
  const [{ data: profile }, summary] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, weight_unit, onboarded_at")
      .eq("id", user.id)
      .single(),
    getDashboardSummary().catch(() => ({ streak: 0, recentPRs: [], weeklyVolume: [] })),
  ]);

  const weightUnit = (profile?.weight_unit ?? "kg") as WeightUnit;
  const totalWeeklyVolume = (summary.weeklyVolume ?? []).reduce(
    (acc, row) => acc + Number(row.volume ?? 0),
    0,
  );

  const today = new Date();
  const dateLabel = today.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const firstName = (profile?.display_name ?? user.email ?? "Athlete").split(" ")[0];

  return (
    <div className="px-5 md:px-8 py-6 max-w-5xl mx-auto">
      <header className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{dateLabel}</div>
          <h1 className="text-2xl font-semibold tracking-tight mt-0.5">Hey, {firstName} 👋</h1>
        </div>
        <Avatar className="h-9 w-9 md:hidden">
          <AvatarFallback>{firstName.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
      </header>

      <Card className="mt-5 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs text-muted-foreground">This week's volume</div>
            <div className="font-mono text-4xl text-primary tabular-nums mt-1">
              {Math.round(totalWeeklyVolume).toLocaleString()}
              <span className="text-base text-muted-foreground ml-1">
                {weightUnit === "kg" ? "kg" : "lb"}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">All sets, all exercises</div>
          </div>
          <div className="relative w-20 h-20" aria-hidden>
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15" stroke="currentColor" strokeWidth="3" fill="none" className="text-muted" />
              <circle
                cx="18"
                cy="18"
                r="15"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                strokeDasharray="94.2"
                strokeDashoffset={Math.max(0, 94.2 - (summary.streak / 7) * 94.2)}
                strokeLinecap="round"
                className="text-primary"
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className="font-mono text-lg leading-none tabular-nums">{summary.streak}</div>
                <div className="text-[10px] text-muted-foreground">day streak</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Link
        href="/app/workout/new"
        className="mt-3 block p-5 rounded-xl bg-primary text-primary-foreground shadow-glow-primary"
      >
        <div className="text-xs opacity-70">Quick start</div>
        <div className="text-lg font-semibold mt-0.5">Start a workout</div>
        <div className="text-xs opacity-80 mt-1 font-mono">From a plan day or freestyle</div>
        <div className="mt-3 inline-flex items-center gap-1 text-sm font-medium">
          Go <ChevronRight className="size-4" aria-hidden />
        </div>
      </Link>

      <section className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Recent PRs</div>
          <Link href="/app/progress" className="text-xs text-primary hover:underline">
            See all
          </Link>
        </div>
        {summary.recentPRs.length === 0 ? (
          <Card className="p-5 text-sm text-muted-foreground">
            No PRs yet. Log a few sets and we'll start tracking your bests.
          </Card>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {summary.recentPRs.map((pr: Record<string, unknown>, idx: number) => {
              const ex = pr.exercise as { name?: string } | { name?: string }[] | null;
              const exName = Array.isArray(ex) ? ex[0]?.name : ex?.name;
              return (
              <Card key={idx} className="flex-none w-44 p-3 border-accent/40">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Flame className="size-3 text-accent" aria-hidden /> {exName ?? "—"}
                </div>
                <div className="font-mono text-xl mt-1 tabular-nums">
                  {formatWeight((pr.best_weight_kg as number | null) ?? null, weightUnit).replace(` ${weightUnit}`, "")}
                  <span className="text-muted-foreground"> × {(pr.best_reps as number | null) ?? 0}</span>
                </div>
                <div className="text-[10px] text-accent mt-1">PR</div>
              </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
