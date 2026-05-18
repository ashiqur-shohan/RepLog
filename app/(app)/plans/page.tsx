import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listPlans } from "@/lib/actions/plans";
import { getEntitlements } from "@/lib/guards";

export default async function PlansPage() {
  const [plans, entitlements] = await Promise.all([listPlans(), getEntitlements()]);
  const limitReached = !entitlements.isPro && plans.length >= 1;

  return (
    <div className="px-5 md:px-8 py-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Plans</h1>
        <Button asChild disabled={limitReached}>
          <Link href={limitReached ? "/settings/billing" : "/plans/new"}>
            <Plus className="size-4" />
            {limitReached ? "Upgrade for more" : "New plan"}
          </Link>
        </Button>
      </div>

      <div className="mt-5 space-y-2">
        {plans.length === 0 ? (
          <Card className="p-8 text-center">
            <h2 className="text-lg font-semibold">Build your first plan</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Group exercises into days, set targets, and log sessions against it.
            </p>
            <Button asChild className="mt-4">
              <Link href="/plans/new">Create plan</Link>
            </Button>
          </Card>
        ) : (
          plans.map((p) => (
            <Link key={p.id} href={`/plans/${p.id}/edit`}>
              <Card className="p-4 hover:border-primary/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    {p.description && (
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {p.description}
                      </div>
                    )}
                  </div>
                  {p.is_active && (
                    <span className="text-[10px] font-mono uppercase tracking-widest text-primary">
                      active
                    </span>
                  )}
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>

      {limitReached && (
        <Card className="mt-4 p-4 border-primary/40">
          <div className="text-xs text-primary font-mono uppercase tracking-widest">
            Free plan limit
          </div>
          <div className="text-sm mt-1">
            You're on Free, which includes 1 active plan. Upgrade to Pro for unlimited plans.
          </div>
          <Button asChild className="mt-3" size="sm">
            <Link href="/settings/billing">Upgrade to Pro</Link>
          </Button>
        </Card>
      )}
    </div>
  );
}
