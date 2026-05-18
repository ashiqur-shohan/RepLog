"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type DraftSet = {
  /** local UUID; persisted server-side as `session_sets.id` once synced */
  id: string;
  exerciseId: string;
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  rpe: number | null;
  isWarmup: boolean;
  completed: boolean;
  syncedAt: number | null;
};

type State = {
  sessionId: string | null;
  startedAt: number | null;
  sets: DraftSet[];
  restEndsAt: number | null;
  restDurationSec: number;
  currentExerciseId: string | null;
  // actions
  startWorkout: (sessionId: string) => void;
  endWorkout: () => void;
  addSet: (set: Omit<DraftSet, "id" | "completed" | "syncedAt">) => void;
  updateSet: (id: string, patch: Partial<DraftSet>) => void;
  completeSet: (id: string, restSec?: number) => void;
  removeSet: (id: string) => void;
  setCurrentExercise: (id: string | null) => void;
  startRest: (sec: number) => void;
  adjustRest: (deltaSec: number) => void;
  skipRest: () => void;
};

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}

export const useActiveWorkout = create<State>()(
  persist(
    (set, get) => ({
      sessionId: null,
      startedAt: null,
      sets: [],
      restEndsAt: null,
      restDurationSec: 90,
      currentExerciseId: null,
      startWorkout(sessionId) {
        set({ sessionId, startedAt: Date.now(), sets: [], restEndsAt: null });
      },
      endWorkout() {
        set({ sessionId: null, startedAt: null, sets: [], restEndsAt: null, currentExerciseId: null });
      },
      addSet(input) {
        const id = uid();
        set({ sets: [...get().sets, { ...input, id, completed: false, syncedAt: null }] });
      },
      updateSet(id, patch) {
        set({ sets: get().sets.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
      },
      completeSet(id, restSec) {
        const sec = restSec ?? get().restDurationSec;
        set({
          sets: get().sets.map((s) => (s.id === id ? { ...s, completed: true } : s)),
          restEndsAt: Date.now() + sec * 1000,
        });
      },
      removeSet(id) {
        set({ sets: get().sets.filter((s) => s.id !== id) });
      },
      setCurrentExercise(id) {
        set({ currentExerciseId: id });
      },
      startRest(sec) {
        set({ restEndsAt: Date.now() + sec * 1000, restDurationSec: sec });
      },
      adjustRest(deltaSec) {
        const end = get().restEndsAt;
        if (!end) return;
        set({ restEndsAt: end + deltaSec * 1000 });
      },
      skipRest() {
        set({ restEndsAt: null });
      },
    }),
    {
      name: "replog-active-workout",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
