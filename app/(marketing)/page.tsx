import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28 grid md:grid-cols-12 gap-10 items-center">
        <div className="md:col-span-7">
          <div className="text-xs font-mono uppercase tracking-widest text-primary mb-4">
            Home workouts · zero friction
          </div>
          <h1 className="text-4xl md:text-6xl font-semibold leading-[1.05] tracking-tight">
            Log it.
            <br />
            Move on.
            <br />
            Lift again.
          </h1>
          <p className="text-muted-foreground mt-6 max-w-md text-base md:text-lg">
            A focused workout tracker for people who train at home. Build your plan, log sets in
            seconds, watch your numbers climb.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/signup">Start free</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/pricing">See pricing</Link>
            </Button>
          </div>
          <div className="mt-12 grid grid-cols-3 gap-6 max-w-lg">
            <div>
              <div className="font-mono text-3xl">150+</div>
              <div className="text-xs text-muted-foreground">curated exercises</div>
            </div>
            <div>
              <div className="font-mono text-3xl">8</div>
              <div className="text-xs text-muted-foreground">muscle groups</div>
            </div>
            <div>
              <div className="font-mono text-3xl">2s</div>
              <div className="text-xs text-muted-foreground">to log a set</div>
            </div>
          </div>
        </div>
        <div className="md:col-span-5">
          <div className="rounded-xl border border-border bg-card p-6 shadow-glow-primary">
            <div className="text-xs text-muted-foreground mb-3">Today · Push day</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-md bg-muted">
                <span className="text-sm">Bench Press</span>
                <span className="font-mono text-sm">80 × 8 @ 8</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md bg-muted">
                <span className="text-sm">Overhead Press</span>
                <span className="font-mono text-sm">50 × 6 @ 9</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md border border-primary/40">
                <span className="text-sm">Tricep Pushdown</span>
                <span className="font-mono text-sm text-primary">25 × 12 · PR</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
