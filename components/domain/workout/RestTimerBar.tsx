"use client";

import { useEffect, useState } from "react";
import { useActiveWorkout } from "@/lib/stores/active-workout";
import { formatTimer } from "@/lib/utils/format";

export function RestTimerBar() {
  const restEndsAt = useActiveWorkout((s) => s.restEndsAt);
  const adjustRest = useActiveWorkout((s) => s.adjustRest);
  const skipRest = useActiveWorkout((s) => s.skipRest);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!restEndsAt) return;
    const i = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(i);
  }, [restEndsAt]);

  if (!restEndsAt) return null;
  const remaining = Math.max(0, Math.ceil((restEndsAt - now) / 1000));

  if (remaining === 0) {
    // Could trigger haptic / sound; auto-dismiss
    setTimeout(() => skipRest(), 1000);
  }

  return (
    <div
      role="timer"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 md:left-60 border-t border-border bg-card safe-bottom z-30"
    >
      <div className="px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => adjustRest(-15)}
          className="w-9 h-9 rounded-md bg-muted font-mono text-xs"
          aria-label="Decrease rest by 15 seconds"
        >
          -15
        </button>
        <div className="flex-1 text-center">
          <div className="font-mono text-3xl text-primary leading-none tabular-nums">
            {formatTimer(remaining)}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Rest</div>
        </div>
        <button
          type="button"
          onClick={() => adjustRest(15)}
          className="w-9 h-9 rounded-md bg-muted font-mono text-xs"
          aria-label="Increase rest by 15 seconds"
        >
          +15
        </button>
        <button
          type="button"
          onClick={skipRest}
          className="w-16 h-9 rounded-md bg-primary text-primary-foreground text-xs font-medium"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
