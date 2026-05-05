import { useState, useEffect } from "react";
import { Edit2, X, Check } from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";
import { mockUser, mockBodyMetrics } from "../data/mockData";

const GOALS = ["Fat Loss","Muscle Gain","Fat Loss + Muscle Gain","Maintenance"];

export default function ProfilePage() {
  const { theme, toggle } = useTheme();
  const [user, setUser] = useState(mockUser);
  const [metrics, setMetrics] = useState(mockBodyMetrics);
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({ name: user.name, age: user.age, height_cm: user.height_cm, goal: user.goal });
  const [showWeightSheet, setShowWeightSheet] = useState(false);
  const [weightForm, setWeightForm] = useState({ weight_kg: "", date: new Date().toISOString().split("T")[0] });
  const [showAllMetrics, setShowAllMetrics] = useState(false);
  const [settings, setSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem("replog-settings") || "{}"); } catch { return {}; }
  });

  const current = metrics[metrics.length - 1];
  const start = metrics[0];
  const delta = (current.weight_kg - start.weight_kg).toFixed(1);
  const progress = Math.min(100, Math.round(((start.weight_kg - current.weight_kg) / (start.weight_kg - user.target_weight_kg)) * 100));

  const saveSetting = (key, value) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    localStorage.setItem("replog-settings", JSON.stringify(next));
    if (key === "darkMode") toggle();
    toast.success("Settings saved");
  };

  const saveInfo = () => {
    setUser(u => ({ ...u, ...infoForm }));
    setEditingInfo(false);
    toast.success("Profile updated");
  };

  const logWeight = () => {
    const w = parseFloat(weightForm.weight_kg);
    if (!w || isNaN(w)) return;
    const bmi = parseFloat((w / Math.pow(user.height_cm / 100, 2)).toFixed(1));
    setMetrics(prev => [...prev, { id: `bm${Date.now()}`, date: weightForm.date, weight_kg: w, bmi }]);
    setShowWeightSheet(false);
    toast.success("Weight logged ✓");
  };

  const displayMetrics = showAllMetrics ? metrics : metrics.slice(-6);

  return (
    <div style={{ padding: "16px 16px 20px", display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Hero */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 8 }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "var(--primary)", border: "3px solid var(--primary)",
          boxShadow: "0 0 0 4px var(--primary-glow), 0 0 20px var(--primary-glow)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 12,
        }}>
          {user.avatar_initials}
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>{user.name}</h1>
        <span style={{
          fontSize: 12, background: "var(--primary-glow)", color: "var(--primary)",
          borderRadius: 20, padding: "4px 14px", marginTop: 4, fontWeight: 600,
        }}>{user.goal}</span>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
          Member since {new Date(user.joined_date).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Progress card */}
      <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 12 }}>Goal Progress</p>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Weight lost: <span style={{ color: delta <= 0 ? "var(--success)" : "var(--danger)", fontWeight: 600 }}>{delta} kg</span></span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)" }}>{progress}%</span>
        </div>
        <div style={{ background: "var(--surface-raised)", borderRadius: 8, height: 8, overflow: "hidden", marginBottom: 8 }}>
          <div style={{ width: `${progress}%`, height: "100%", background: "var(--primary)", borderRadius: 8, transition: "width 0.5s ease" }} />
        </div>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{progress}% to your goal! Keep going 🔥</p>
      </div>

      {/* Body stats */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase" }}>Body Stats</p>
          <button onClick={() => setShowWeightSheet(true)} style={{
            fontSize: 12, background: "var(--primary)", color: "#fff", border: "none",
            borderRadius: 8, padding: "4px 12px", cursor: "pointer",
          }}>Update Stats</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { label: "Current Weight", value: `${current.weight_kg}`, unit: "kg" },
            { label: "Target Weight", value: `${user.target_weight_kg}`, unit: "kg" },
            { label: "Height", value: `${user.height_cm}`, unit: "cm" },
            { label: "BMI", value: `${current.bmi}`, unit: "" },
          ].map(({ label, value, unit }) => (
            <div key={label} style={{ background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border)", padding: "14px 16px" }}>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>{label}</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>
                {value}<span style={{ fontSize: 13, fontWeight: 400, color: "var(--text-muted)", marginLeft: 2 }}>{unit}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Weight log */}
      <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 12 }}>Weight Log</p>
        {displayMetrics.slice().reverse().map((m, i, arr) => {
          const prev = arr[i + 1];
          const diff = prev ? (m.weight_kg - prev.weight_kg).toFixed(1) : null;
          return (
            <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{m.weight_kg} kg</span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>BMI {m.bmi}</span>
              {diff !== null && (
                <span style={{ fontSize: 12, fontWeight: 600, color: diff <= 0 ? "var(--success)" : "var(--danger)" }}>
                  {diff > 0 ? "▲" : "▼"} {Math.abs(diff)}
                </span>
              )}
            </div>
          );
        })}
        {metrics.length > 6 && (
          <button onClick={() => setShowAllMetrics(v => !v)} style={{ fontSize: 12, color: "var(--primary)", background: "none", border: "none", cursor: "pointer", marginTop: 8 }}>
            {showAllMetrics ? "Show less" : "See all"}
          </button>
        )}
      </div>

      {/* Personal info */}
      <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase" }}>Personal Info</p>
          {!editingInfo
            ? <button onClick={() => setEditingInfo(true)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 10px", color: "var(--text-muted)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><Edit2 size={12} /> Edit</button>
            : <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setEditingInfo(false)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 10px", color: "var(--text-muted)", fontSize: 12, cursor: "pointer" }}>Cancel</button>
                <button onClick={saveInfo} style={{ background: "var(--primary)", border: "none", borderRadius: 8, padding: "4px 12px", color: "#fff", fontSize: 12, cursor: "pointer" }}>Save</button>
              </div>
          }
        </div>
        {editingInfo ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Name", key: "name", type: "text" },
              { label: "Age", key: "age", type: "number" },
              { label: "Height (cm)", key: "height_cm", type: "number" },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>{label}</label>
                <input type={type} value={infoForm[key]} onChange={e => setInfoForm(f => ({ ...f, [key]: e.target.value }))}
                  style={{ width: "100%", minHeight: 44, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface-raised)", color: "var(--text-primary)", fontSize: 14, padding: "0 12px", outline: "none" }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Goal</label>
              <select value={infoForm.goal} onChange={e => setInfoForm(f => ({ ...f, goal: e.target.value }))}
                style={{ width: "100%", minHeight: 44, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface-raised)", color: "var(--text-primary)", fontSize: 14, padding: "0 12px", outline: "none" }}>
                {GOALS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[["Name", user.name],["Age", `${user.age} years`],["Height", `${user.height_cm} cm`],["Goal", user.goal]].map(([k,v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings */}
      <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 12 }}>App Settings</p>
        {[
          { key: "darkMode", label: "🌙 Dark Mode", value: theme === "dark" },
          { key: "reminders", label: "🔔 Workout Reminders", value: !!settings.reminders },
          { key: "weightLbs", label: "⚖️ Weight in lbs", value: !!settings.weightLbs },
          { key: "heightFt", label: "📏 Height in ft", value: !!settings.heightFt },
        ].map(({ key, label, value }) => (
          <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: 14, color: "var(--text-primary)" }}>{label}</span>
            <button onClick={() => saveSetting(key, !value)} style={{
              width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
              background: value ? "var(--primary)" : "var(--surface-raised)",
              position: "relative", transition: "background 0.2s",
            }}>
              <span style={{
                position: "absolute", top: 2, left: value ? 22 : 2,
                width: 20, height: 20, borderRadius: "50%",
                background: "#fff", transition: "left 0.2s",
              }} />
            </button>
          </div>
        ))}
      </div>

      {/* Update weight sheet */}
      {showWeightSheet && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.6)", display: "flex", flexDirection: "column", justifyContent: "flex-end" }} onClick={() => setShowWeightSheet(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: "20px 20px 0 0", padding: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Log Weight</h2>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Weight (kg)</label>
              <input
                type="number"
                inputMode="decimal"
                value={weightForm.weight_kg}
                onChange={e => setWeightForm(f => ({ ...f, weight_kg: e.target.value }))}
                placeholder="e.g. 66.0"
                style={{ width: "100%", minHeight: 48, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface-raised)", color: "var(--text-primary)", fontSize: 16, padding: "0 12px", outline: "none" }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Date</label>
              <input
                type="date"
                value={weightForm.date}
                onChange={e => setWeightForm(f => ({ ...f, date: e.target.value }))}
                style={{ width: "100%", minHeight: 48, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface-raised)", color: "var(--text-primary)", fontSize: 14, padding: "0 12px", outline: "none" }}
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowWeightSheet(false)} style={{ flex: 1, minHeight: 48, borderRadius: 10, border: "1px solid var(--border)", background: "none", color: "var(--text-muted)", cursor: "pointer" }}>Cancel</button>
              <button onClick={logWeight} style={{ flex: 2, minHeight: 48, borderRadius: 10, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 600, cursor: "pointer" }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
