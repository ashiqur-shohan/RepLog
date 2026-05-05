import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronUp, ChevronDown, Plus, Trash2, X, Timer } from "lucide-react";
import toast from "react-hot-toast";
import { useWorkout } from "../context/WorkoutContext";
import { mockExercises, mockWeeklyPlan } from "../data/mockData";
import { getDayName, generateId, getSplitColor } from "../lib/utils";
import ExercisePicker from "../components/ExercisePicker";

const saveWorkoutLog = (logData) => Promise.resolve({ id: generateId(), ...logData });

const RPE_OPTIONS = [
  { value: 1, emoji: "😴", label: "Easy" },
  { value: 4, emoji: "😤", label: "Moderate" },
  { value: 7, emoji: "💪", label: "Hard" },
  { value: 10, emoji: "🔥", label: "Max" },
];

function useTimer(running) {
  const [elapsed, setElapsed] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (running) { ref.current = setInterval(() => setElapsed(e => e + 1), 1000); }
    else { clearInterval(ref.current); }
    return () => clearInterval(ref.current);
  }, [running]);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  return { elapsed, display: `${mm}:${ss}` };
}

function Stepper({ value, onChange, min = 0, max = 200, step = 1 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      <button
        onClick={() => onChange(Math.max(min, value - step))}
        style={{ width: 32, height: 36, borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface-raised)", color: "var(--text-primary)", cursor: "pointer", fontSize: 16 }}
      >−</button>
      <input
        type="number"
        value={value}
        onChange={e => onChange(Math.min(max, Math.max(min, Number(e.target.value))))}
        inputMode="numeric"
        style={{
          width: 48, textAlign: "center", minHeight: 36, borderRadius: 6,
          border: "1px solid var(--border)", background: "var(--surface-raised)",
          color: "var(--text-primary)", fontSize: 14, fontWeight: 600, outline: "none",
        }}
      />
      <button
        onClick={() => onChange(Math.min(max, value + step))}
        style={{ width: 32, height: 36, borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface-raised)", color: "var(--text-primary)", cursor: "pointer", fontSize: 16 }}
      >+</button>
    </div>
  );
}

export default function LogPage() {
  const navigate = useNavigate();
  const { logs: allLogs, saveWorkoutLog: contextSave } = useWorkout();
  const [state, setState] = useState("ready"); // ready | active | finish
  const [exercises, setExercises] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [showFinish, setShowFinish] = useState(false);
  const [notes, setNotes] = useState("");
  const [rpe, setRpe] = useState(null);
  const [restTimers, setRestTimers] = useState({});
  const { elapsed, display: timerDisplay } = useTimer(state === "active");

  const todayName = getDayName();
  const todayPlan = mockWeeklyPlan.days[todayName] || { split: "Rest", color: "#6B7280", exercises: [] };

  const lastSplit = (split) => {
    const found = allLogs.find(l => l.split === split);
    if (!found) return null;
    const days = Math.floor((Date.now() - new Date(found.date).getTime()) / 86400000);
    return `Last ${split}: ${days} day${days !== 1 ? "s" : ""} ago — ${found.duration_min} min, ${found.total_sets} sets`;
  };

  const startPlan = () => {
    const exs = todayPlan.exercises.map(id => {
      const ex = mockExercises.find(e => e.id === id);
      return ex ? buildExerciseEntry(ex) : null;
    }).filter(Boolean);
    setExercises(exs);
    setState("active");
  };

  const startCustom = () => { setExercises([]); setState("active"); };

  const buildExerciseEntry = (ex) => ({
    _key: generateId(),
    exercise_id: ex.id,
    name: ex.name,
    muscle: ex.muscle_primary,
    equipment: ex.equipment,
    category: ex.category,
    sets: [{ reps: 12, weight: 0 }],
  });

  const addPickedExercise = (ex) => {
    setExercises(prev => [...prev, buildExerciseEntry(ex)]);
    setShowPicker(false);
  };

  const removeExercise = (key) => setExercises(prev => prev.filter(e => e._key !== key));

  const updateSet = (key, setIdx, field, value) => {
    setExercises(prev => prev.map(e => {
      if (e._key !== key) return e;
      const sets = e.sets.map((s, i) => i === setIdx ? { ...s, [field]: value } : s);
      return { ...e, sets };
    }));
  };

  const addSet = (key) => {
    setExercises(prev => prev.map(e => {
      if (e._key !== key) return e;
      const last = e.sets[e.sets.length - 1] || { reps: 12, weight: 0 };
      return { ...e, sets: [...e.sets, { ...last }] };
    }));
  };

  const removeSet = (key, idx) => {
    setExercises(prev => prev.map(e => {
      if (e._key !== key) return e;
      if (e.sets.length <= 1) return e;
      return { ...e, sets: e.sets.filter((_, i) => i !== idx) };
    }));
  };

  const startRest = (key) => {
    setRestTimers(prev => ({ ...prev, [key]: 60 }));
    const interval = setInterval(() => {
      setRestTimers(prev => {
        const val = (prev[key] || 0) - 1;
        if (val <= 0) { clearInterval(interval); return { ...prev, [key]: 0 }; }
        return { ...prev, [key]: val };
      });
    }, 1000);
  };

  const totalSets = exercises.reduce((acc, e) => acc + e.sets.length, 0);
  const totalVolume = exercises.reduce((acc, e) =>
    acc + e.sets.reduce((s, set) => s + set.reps * (set.weight || 70), 0), 0
  );

  const handleSave = async () => {
    const logData = {
      date: new Date().toISOString().split("T")[0],
      day: todayName,
      split: todayPlan.split,
      duration_min: Math.round(elapsed / 60) || 1,
      total_sets: totalSets,
      exercises: exercises.map(e => ({
        exercise_id: e.exercise_id,
        name: e.name,
        sets: e.sets,
      })),
      notes,
      rpe,
    };
    await contextSave(logData);
    toast.success("Workout saved! 💪");
    navigate("/history");
  };

  // Auto-save draft
  useEffect(() => {
    if (state !== "active") return;
    const t = setInterval(() => {
      localStorage.setItem("replog-draft", JSON.stringify({ exercises, elapsed }));
    }, 30000);
    return () => clearInterval(t);
  }, [state, exercises, elapsed]);

  if (state === "ready") {
    return (
      <div style={{ padding: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Log Workout</h1>
        <div style={{
          background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)",
          padding: 16, marginBottom: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 18 }}>
              {todayPlan.split === "Rest" ? "😴" : "💪"}
            </span>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
                {todayName} — {todayPlan.split}
              </p>
              {todayPlan.split !== "Rest" && (
                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{todayPlan.exercises.length} exercises planned</p>
              )}
            </div>
          </div>
          {todayPlan.exercises.slice(0, 5).map(id => {
            const ex = mockExercises.find(e => e.id === id);
            return ex ? (
              <div key={id} style={{ fontSize: 13, color: "var(--text-muted)", padding: "4px 0", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: todayPlan.color }} />
                {ex.name}
              </div>
            ) : null;
          })}
          {lastSplit(todayPlan.split) && (
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
              {lastSplit(todayPlan.split)}
            </p>
          )}
        </div>

        <button onClick={startPlan} style={{
          width: "100%", minHeight: 52, borderRadius: 12, border: "none",
          background: "var(--primary)", color: "#fff", fontSize: 16, fontWeight: 600,
          cursor: "pointer", boxShadow: "0 0 20px var(--primary-glow)", marginBottom: 10,
        }}>
          Start Today's Plan →
        </button>
        <button onClick={startCustom} style={{
          width: "100%", minHeight: 52, borderRadius: 12,
          border: "1px solid var(--border)", background: "none",
          color: "var(--text-muted)", fontSize: 16, cursor: "pointer",
        }}>
          Start Custom Workout
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      {/* Timer */}
      <div style={{
        position: "sticky", top: 0, background: "var(--background)",
        zIndex: 10, paddingBottom: 12, paddingTop: 8,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ fontSize: 32, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: "var(--primary)" }}>
            {timerDisplay}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, background: todayPlan.color || "var(--primary)",
              color: "#fff", borderRadius: 6, padding: "2px 8px",
            }}>{todayPlan.split.toUpperCase()}</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </span>
          </div>
        </div>
        <button onClick={() => setShowFinish(true)} style={{
          padding: "10px 16px", borderRadius: 10, border: "none",
          background: "var(--success)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
        }}>Finish</button>
      </div>

      {/* Exercises */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {exercises.map((ex) => (
          <div key={ex._key} style={{ background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--border)" }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{ex.name}</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{ex.muscle} · {ex.equipment}</p>
              </div>
              <button onClick={() => removeExercise(ex._key)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: "8px 14px" }}>
              {/* Header */}
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)", width: 28 }}>SET</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)", flex: 1, textAlign: "center" }}>REPS</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)", flex: 1, textAlign: "center" }}>WEIGHT (kg)</span>
                <span style={{ width: 20 }} />
              </div>

              {ex.sets.map((set, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", width: 28, textAlign: "center" }}>{i + 1}</span>
                  <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                    <Stepper value={set.reps} min={1} max={100} step={1} onChange={v => updateSet(ex._key, i, "reps", v)} />
                  </div>
                  <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                    <Stepper value={set.weight} min={0} max={200} step={0.5} onChange={v => updateSet(ex._key, i, "weight", v)} />
                  </div>
                  <button onClick={() => removeSet(ex._key, i)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", width: 20 }}>
                    <X size={12} />
                  </button>
                </div>
              ))}

              <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
                <button onClick={() => addSet(ex._key)} style={{
                  flex: 1, padding: "8px", borderRadius: 8, border: "1px dashed var(--border)",
                  background: "none", color: "var(--primary)", fontSize: 12, cursor: "pointer",
                }}>+ Add Set</button>
                <button onClick={() => startRest(ex._key)} style={{
                  padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)",
                  background: "var(--surface-raised)", color: "var(--text-muted)", fontSize: 12, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  <Timer size={12} />
                  {restTimers[ex._key] > 0 ? `${restTimers[ex._key]}s` : "Rest 60s"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {exercises.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
          <p style={{ marginBottom: 8 }}>No exercises added yet</p>
        </div>
      )}

      <button onClick={() => setShowPicker(true)} style={{
        width: "100%", minHeight: 48, borderRadius: 12, border: "1px dashed var(--border)",
        background: "none", color: "var(--primary)", fontSize: 14, cursor: "pointer", marginTop: 12,
      }}>+ Add Exercise</button>

      {showPicker && <ExercisePicker onSelect={addPickedExercise} onClose={() => setShowPicker(false)} />}

      {/* Finish Modal */}
      {showFinish && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.6)", display: "flex", flexDirection: "column", justifyContent: "flex-end" }} onClick={() => setShowFinish(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: "20px 20px 0 0", padding: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Finish Workout</h2>

            {/* Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[
                { label: "Duration", value: `${Math.max(1, Math.round(elapsed / 60))} min` },
                { label: "Exercises", value: exercises.length },
                { label: "Total Sets", value: totalSets },
                { label: "Est. Volume", value: `${Math.round(totalVolume)} kg` },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: "var(--surface-raised)", borderRadius: 12, padding: 12, textAlign: "center" }}>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>{label}</p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Notes */}
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add session notes..."
              rows={2}
              style={{
                width: "100%", borderRadius: 12, border: "1px solid var(--border)",
                background: "var(--surface-raised)", color: "var(--text-primary)",
                fontSize: 14, padding: 12, outline: "none", resize: "none", marginBottom: 14,
              }}
            />

            {/* RPE */}
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>How hard was it?</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {RPE_OPTIONS.map(({ value, emoji, label }) => (
                <button key={value} onClick={() => setRpe(value)} style={{
                  flex: 1, padding: "8px 4px", borderRadius: 10, border: rpe === value ? "2px solid var(--primary)" : "1px solid var(--border)",
                  background: rpe === value ? "var(--primary-glow)" : "var(--surface-raised)",
                  cursor: "pointer", fontSize: 11, color: "var(--text-muted)", textAlign: "center",
                }}>
                  <div style={{ fontSize: 18 }}>{emoji}</div>
                  <div>{label}</div>
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowFinish(false)} style={{ flex: 1, minHeight: 48, borderRadius: 10, border: "1px solid var(--border)", background: "none", color: "var(--text-muted)", cursor: "pointer" }}>Keep Going</button>
              <button onClick={handleSave} style={{ flex: 2, minHeight: 48, borderRadius: 10, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 600, cursor: "pointer", boxShadow: "0 0 20px var(--primary-glow)" }}>
                Save Workout ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
