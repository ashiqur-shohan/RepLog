import Link from "next/link";
import { Button } from "@/components/ui/button";

const freeFeatures = [
  "1 active workout plan",
  "Unlimited sessions",
  "Full exercise library",
  "History & basic charts",
];

const proFeatures = [
  "Unlimited workout plans",
  "Custom exercises",
  "Progress photos (private)",
  "CSV export",
  "Advanced charts & trends",
];

export default function PricingPage() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-20">
      <h1 className="text-3xl md:text-4xl font-semibold text-center tracking-tight">
        Free for life. Pro when you want more.
      </h1>
      <p className="mt-3 text-center text-muted-foreground">
        Start tracking today. Upgrade anytime. Cancel anytime.
      </p>
      <div className="grid md:grid-cols-2 gap-6 mt-12">
        <div className="rounded-xl border border-border p-8 bg-card">
          <div className="text-sm text-muted-foreground">Free</div>
          <div className="font-mono text-5xl mt-2">$0</div>
          <div className="text-xs text-muted-foreground">forever</div>
          <ul className="mt-6 space-y-2 text-sm">
            {freeFeatures.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span aria-hidden className="text-success">
                  ✓
                </span>
                {f}
              </li>
            ))}
          </ul>
          <Button asChild variant="outline" className="w-full mt-8">
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
        <div className="rounded-xl border-2 border-primary p-8 bg-card shadow-glow-primary">
          <div className="flex items-center justify-between">
            <div className="text-sm text-primary">Pro</div>
            <span className="text-[10px] font-mono uppercase tracking-widest bg-primary text-primary-foreground px-2 py-0.5 rounded">
              popular
            </span>
          </div>
          <div className="font-mono text-5xl mt-2">
            $5<span className="text-xl text-muted-foreground">/mo</span>
          </div>
          <div className="text-xs text-muted-foreground">cancel anytime · 14-day refund</div>
          <ul className="mt-6 space-y-2 text-sm">
            {proFeatures.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span aria-hidden className="text-primary">
                  ✓
                </span>
                {f}
              </li>
            ))}
          </ul>
          <Button asChild className="w-full mt-8">
            <Link href="/signup?tier=pro">Start with Pro</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
