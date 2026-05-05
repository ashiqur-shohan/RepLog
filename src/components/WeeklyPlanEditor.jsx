import { useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { useWorkout } from "../context/WorkoutContext";
import { mockExercises } from "../data/mockData";
import ExercisePicker from "./ExercisePicker";

const DAYS = ["Saturday","Sunday","Monday","Tuesday","Wednesday","Thursday","Friday"];
const SPLITS = [
  { label: "Push", color: "#EF4444" },
  { label: "Pull", color: "#3B82F6" },
  { label: "Legs", color: "#22C55E" },
  { label: "Core+Cardio", color: "#F59E0B" },
  { label: "Core", color: "#F59E0B" },
  { label: "Rest", color: "#6B7280" },
];

export default function WeeklyPlanEditor({ onClose }) {
  const { weeklyPlan, updateWeeklyPlan } = useWorkout();
  const [plan, setPlan] = useState(JSON.parse(JSON.stringify(weeklyPlan)));
  const [activeDay, setActiveDay] = useState("Saturday");
  const [showPicker, setShowPicker] = useState(false);

  const dayData = plan.days[activeDay] || { split: "Rest", color: "#6B7280", exercises: [] };

  const setSplit = (split, color) => {
    setPlan(p => ({ ...p, days: { ...p.days, [activeDay]: { ...dayData, split, color } } }));
  };

  const removeExercise = (id) => {
    setPlan(p => ({
      ...p,
      days: { ...p.days, [activeDay]: { ...dayData, exercises: dayData.exercises.filter(e => e !== id) } }
    }));
  };

  const addExercise = (ex) => {
    if (dayData.exercises.includes(ex.id)) return;
    setPlan(p => ({
      ...p,
      days: { ...p.days, [activeDay]: { ...dayData, exercises: [...dayData.exercises, ex.id] } }
    }));
    setShowPicker(false);
  };

  const save = async () => {
    await updateWeeklyPlan(plan);
    toast.success("Weekly plan updated ✓");
    onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.6)", display: "flex", flexDirection: "column",
      justifyContent: "flex-end",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--surface)", borderRadius: "20px 20px 0 0",
        maxHeight: "90vh", display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ padding: "16px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Edit Weekly Plan</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
            <X size={20} />
          </button>
        </div>

        {/* Day tabs */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "12px 16px 0" }}>
          {DAYS.map(d => (
            <button key={d} onClick={() => setActiveDay(d)} style={{
              flexShrink: 0, padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500,
              border: activeDay === d ? "2px solid var(--primary)" : "1px solid var(--border)",
              background: activeDay === d ? "var(--primary-glow)" : "var(--surface-raised)",
              color: activeDay === d ? "var(--primary)" : "var(--text-muted)",
              cursor: "pointer",
            }}>{d.slice(0,3)}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {/* Split selector */}
          <p style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Split</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            {SPLITS.map(({ label, color }) => (
              <button key={label} onClick={() => setSplit(label, color)} style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: dayData.split === label ? color : "var(--surface-raised)",
                color: dayData.split === label ? "#fff" : "var(--text-muted)",
                border: `1px solid ${dayData.split === label ? color : "var(--border)"}`,
                cursor: "pointer",
              }}>{label}</button>
            ))}
          </div>

          {/* Exercises */}
          {dayData.split !== "Rest" && (
            <>
              <p style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Exercises</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                {dayData.exercises.map(id => {
                  const ex = mockExercises.find(e => e.id === id);
                  return (
                    <div key={id} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      background: "var(--surface-raised)", borderRadius: 10, padding: "10px 12px",
                    }}>
                      <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{ex?.name || id}</span>
                      <button onClick={() => removeExercise(id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)" }}>
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <button onClick={() => setShowPicker(true)} style={{
                width: "100%", padding: "10px", borderRadius: 10, border: "1px dashed var(--border)",
                background: "none", color: "var(--primary)", fontSize: 13, cursor: "pointer",
              }}>+ Add Exercise</button>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: 16, display: "flex", gap: 10, borderTop: "1px solid var(--border)" }}>
          <button onClick={onClose} style={{
            flex: 1, minHeight: 48, borderRadius: 8, border: "1px solid var(--border)",
            background: "none", color: "var(--text-muted)", fontSize: 14, cursor: "pointer",
          }}>Cancel</button>
          <button onClick={save} style={{
            flex: 2, minHeight: 48, borderRadius: 8, border: "none",
            background: "var(--primary)", color: "#fff", fontSize: 14, fontWeight: 600,
            cursor: "pointer", boxShadow: "0 0 20px var(--primary-glow)",
          }}>Save Plan</button>
        </div>
      </div>

      {showPicker && (
        <ExercisePicker onSelect={addExercise} onClose={() => setShowPicker(false)} />
      )}
    </div>
  );
}
