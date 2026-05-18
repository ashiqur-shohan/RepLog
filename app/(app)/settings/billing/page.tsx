import { ChevronLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { getMyEntitlements } from "@/lib/actions/billing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BillingForm } from "./BillingForm";

const PRO_FEATURES = [
  "Unlimited workout plans",
  "Custom exercises",
  "Progress photos",
  "CSV export",
  "Advanced charts",
];

export const metadata = { title: "Billing — replog" };

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const sp = await searchParams;
  const entitlements = await getMyEntitlements();
  const isPro = entitlements.tier === "pro";

  const renewDate = entitlements.renewsAt
    ? format(new Date(entitlements.renewsAt), "MMM d, yyyy")
    : null;

  return (
    <div className="max-w-lg mx-auto px-5 py-8 space-y-6">
      {sp.success === "1" && (
        <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          <CheckCircle2 className="size-4 shrink-0" />
          Welcome to Pro! Your subscription is now active.
        </div>
      )}

      {/* Back link + heading */}
      <div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          Settings
        </Link>
        <h1 className="text-xl font-semibold mt-1">Billing</h1>
      </div>

      {/* Current plan card */}
      {isPro ? (
        <Card className="border-primary shadow-glow-primary">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-primary font-mono uppercase tracking-widest">Pro</div>
                <div className="font-mono text-2xl mt-1">
                  $5<span className="text-sm text-muted-foreground">/mo</span>
                </div>
              </div>
              <Badge variant="default">{entitlements.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {renewDate && (
              <p className="text-xs text-muted-foreground">
                {entitlements.cancelAtPeriodEnd
                  ? `Cancels on ${renewDate}`
                  : `Renews on ${renewDate}`}
              </p>
            )}
            {/* Portal button — client component to avoid full-page redirect inline */}
            <BillingForm action="portal" />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
                  Free
                </div>
                <div className="font-mono text-2xl mt-1">$0</div>
              </div>
              <Badge variant="secondary">active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Upgrade to Pro to unlock unlimited plans, custom exercises, progress photos, and more.
            </p>
            <BillingForm action="checkout" />
          </CardContent>
        </Card>
      )}

      {/* Pro features list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
            {isPro ? "Included with Pro" : "Unlock with Pro"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-muted-foreground">
                <span
                  className={isPro ? "text-primary" : "text-muted-foreground/40"}
                  aria-hidden
                >
                  ✓
                </span>
                {f}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
