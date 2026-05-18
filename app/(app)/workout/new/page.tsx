import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { startSession } from "@/lib/actions/sessions";
import { listPlans } from "@/lib/actions/plans";
import { requireUser } from "@/lib/guards";

export default async function NewWorkoutPage() {
  const { user, supabase } = await requireUser();
  const plans = await listPlans();

  // Fetch days for first plan to offer quick-start options
  const firstPlanId = plans[0]?.id;
  const { data: days } = firstPlanId
    ? await supabase
        .from("plan_days")
        .select("id, name, position")
        .eq("plan_id", firstPlanId)
        .is("deleted_at", null)
        .order("position")
    : { data: null };

  async function start(planDayId: string | null) {
    "use server";
    const r = await startSession({ plan_day_id: planDayId ?? undefined });
    if (!r.ok) return;
    redirect(`/workout/${r.data.id}`);
  }

  return (
    <div className="px-5 md:px-8 py-6 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight">Start a workout</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Pick a plan day or go freestyle. You can swap exercises on the fly.
      </p>

      {days && days.length > 0 && (
        <div className="mt-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
            From your plan
          </div>
          <div className="space-y-2">
            {days.map((d) => (
              <form key={d.id} action={start.bind(null, d.id)}>
                <button type="submit" className="w-full text-left">
                  <Card className="p-4 hover:border-primary/50 transition-colors">
                    <div className="text-xs text-muted-foreground">Day {d.position}</div>
                    <div className="font-medium">{d.name}</div>
                  </Card>
                </button>
              </form>
            ))}
          </div>
        </div>
      )}

      <form action={start.bind(null, null)} className="mt-6">
        <Button type="submit" variant="outline" className="w-full">
          Freestyle workout
        </Button>
      </form>

      {plans.length === 0 && (
        <Card className="mt-6 p-4 text-sm">
          You don't have a plan yet.{" "}
          <Link href="/plans/new" className="text-primary underline">
            Create one
          </Link>{" "}
          to track structured sessions.
        </Card>
      )}
    </div>
  );
}
