import { useState } from "react";
import { X, Search } from "lucide-react";
import { mockExercises } from "../data/mockData";
import { getSplitColor } from "../lib/utils";

export default function ExercisePicker({ onSelect, onClose }) {
  const [query, setQuery] = useState("");

  const filtered = mockExercises.filter(ex =>
    !query ||
    ex.name.toLowerCase().includes(query.toLowerCase()) ||
    ex.muscle_primary.toLowerCase().includes(query.toLowerCase()) ||
    ex.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.7)", display: "flex", flexDirection: "column", justifyContent: "flex-end",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--surface)", borderRadius: "20px 20px 0 0",
        maxHeight: "80vh", display: "flex", flexDirection: "column",
      }}>
        <div style={{ padding: "16px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Pick an Exercise</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: "12px 16px", position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 26, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search exercises..."
            style={{
              width: "100%", minHeight: 44, borderRadius: 10, border: "1px solid var(--border)",
              background: "var(--surface-raised)", color: "var(--text-primary)",
              fontSize: 14, paddingLeft: 36, paddingRight: 12, outline: "none",
            }}
          />
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px" }}>
          {filtered.map(ex => (
            <button key={ex.id} onClick={() => onSelect(ex)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "12px 0", borderBottom: "1px solid var(--border)",
              background: "none", border: "none", borderBottom: "1px solid var(--border)",
              cursor: "pointer", textAlign: "left",
            }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: getSplitColor(ex.category), flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 500 }}>{ex.name}</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{ex.muscle_primary} · {ex.equipment}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
