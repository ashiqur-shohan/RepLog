import { requireAdmin } from "@/lib/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Dumbbell, PenSquare, CreditCard, Activity } from "lucide-react";

async function fetchStats() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [usersResult, exercisesResult, customExercisesResult, activeSubsResult, sessionsResult] =
    await Promise.all([
      // Total users via auth admin
      admin.auth.admin.listUsers({ perPage: 1 }),
      // Total global exercises
      admin
        .from("exercises")
        .select("id", { count: "exact", head: true })
        .eq("is_global", true)
        .is("deleted_at", null),
      // Custom exercises (user-created)
      admin
        .from("exercises")
        .select("id", { count: "exact", head: true })
        .eq("is_global", false)
        .is("deleted_at", null),
      // Active subscriptions
      admin
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("status", "active")
        .eq("tier", "pro"),
      // Sessions started today
      admin
        .from("workout_sessions")
        .select("id", { count: "exact", head: true })
        .gte("started_at", today.toISOString()),
    ]) as [
      { data: { total?: number; users: unknown[] } },
      { count: number | null },
      { count: number | null },
      { count: number | null },
      { count: number | null },
    ];

  return {
    totalUsers: usersResult.data?.total ?? usersResult.data?.users?.length ?? 0,
    totalExercises: exercisesResult.count ?? 0,
    customExercises: customExercisesResult.count ?? 0,
    activeSubscriptions: activeSubsResult.count ?? 0,
    sessionsToday: sessionsResult.count ?? 0,
  };
}

type StatCardProps = {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
};

function StatCard({ title, value, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <Icon className="size-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="font-mono text-3xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

export const metadata = { title: "Admin Overview — replog" };

export default async function AdminOverviewPage() {
  await requireAdmin();
  const stats = await fetchStats();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Total users" value={stats.totalUsers} icon={Users} />
        <StatCard title="Global exercises" value={stats.totalExercises} icon={Dumbbell} />
        <StatCard title="Custom exercises" value={stats.customExercises} icon={PenSquare} />
        <StatCard title="Active Pro subs" value={stats.activeSubscriptions} icon={CreditCard} />
        <StatCard title="Sessions today" value={stats.sessionsToday} icon={Activity} />
      </div>
    </div>
  );
}
