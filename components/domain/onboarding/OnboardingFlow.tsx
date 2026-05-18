"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { completeOnboarding } from "@/lib/actions/profile";

type Goal = "build_muscle" | "get_stronger" | "stay_consistent" | "lose_weight";
type WeightUnit = "kg" | "lb";
type Experience = "beginner" | "intermediate" | "advanced";

const GOALS: { value: Goal; label: string; description: string }[] = [
  { value: "build_muscle", label: "Build muscle", description: "Hypertrophy · progressive overload" },
  { value: "get_stronger", label: "Get stronger", description: "Heavy compounds · low reps" },
  { value: "stay_consistent", label: "Stay consistent", description: "Habit + general fitness" },
  { value: "lose_weight", label: "Lose weight", description: "High volume · cardio mix" },
];

const EXPERIENCE_LEVELS: { value: Experience; label: string; description: string }[] = [
  { value: "beginner", label: "Beginner", description: "0–6 months consistent training" },
  { value: "intermediate", label: "Intermediate", description: "6 months – 2 years" },
  { value: "advanced", label: "Advanced", description: "2+ years, know your numbers" },
];

export function OnboardingFlow() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [experience, setExperience] = useState<Experience | null>(null);

  function handleContinue() {
    if (step === 1 && !goal) {
      toast.error("Please select a goal to continue.");
      return;
    }
    if (step < 3) {
      setStep((s) => s + 1);
      return;
    }
    // Step 3: finish
    if (!experience) {
      toast.error("Please select your experience level.");
      return;
    }
    const fd = new FormData();
    fd.set("goal", goal!);
    fd.set("weight_unit", weightUnit);
    fd.set("experience", experience);
    startTransition(async () => {
      const result = await completeOnboarding(fd);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.replace("/dashboard");
    });
  }

  return (
    <div className="flex flex-col h-full px-5 pt-12 pb-safe-bottom">
      {/* Progress bar */}
      <div className="flex items-center gap-1 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded transition-colors ${s <= step ? "bg-primary" : "bg-muted"}`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="flex flex-col flex-1">
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Step 1 of 3</div>
          <h1 className="text-2xl font-semibold mt-1">What&#39;s your goal?</h1>
          <p className="text-sm text-muted-foreground mt-1">Pick one. You can change later.</p>
          <div className="mt-6 space-y-3 flex-1">
            {GOALS.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => setGoal(g.value)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  goal === g.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/40"
                }`}
              >
                <div className="font-medium">{g.label}</div>
                <div className="text-xs text-muted-foreground">{g.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col flex-1">
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Step 2 of 3</div>
          <h1 className="text-2xl font-semibold mt-1">Units</h1>
          <p className="text-sm text-muted-foreground mt-1">All weights in the app will use this.</p>
          <div className="mt-6 grid grid-cols-2 gap-3 flex-1">
            {(["kg", "lb"] as WeightUnit[]).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setWeightUnit(u)}
                className={`p-6 rounded-lg text-center transition-colors ${
                  weightUnit === u
                    ? "border-2 border-primary bg-primary/5"
                    : "border border-border hover:border-muted-foreground/40"
                }`}
              >
                <div className="font-mono text-3xl">{u}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {u === "kg" ? "metric" : "imperial"}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col flex-1">
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Step 3 of 3</div>
          <h1 className="text-2xl font-semibold mt-1">How experienced are you?</h1>
          <p className="text-sm text-muted-foreground mt-1">We&#39;ll suggest plans that fit.</p>
          <div className="mt-6 space-y-3 flex-1">
            {EXPERIENCE_LEVELS.map((e) => (
              <button
                key={e.value}
                type="button"
                onClick={() => setExperience(e.value)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  experience === e.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/40"
                }`}
              >
                <div className="font-medium">{e.label}</div>
                <div className="text-xs text-muted-foreground">{e.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom buttons */}
      <div className="mt-auto pb-8 flex gap-2">
        {step > 1 && (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => setStep((s) => s - 1)}
            disabled={pending}
          >
            Back
          </Button>
        )}
        <Button
          type="button"
          className="flex-1"
          onClick={handleContinue}
          disabled={pending}
        >
          {step === 3 ? (pending ? "Saving…" : "Finish") : "Continue"}
        </Button>
      </div>
    </div>
  );
}
