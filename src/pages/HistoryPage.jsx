import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useWorkout } from "../context/WorkoutContext";
import { mockStats } from "../data/mockData";
import { getSplitColor } from "../lib/utils";

const SPLITS = ["All","Push","Pull","Legs","Core+Cardio","Rest"];

function groupByWeek(logs) {
  const now = new Date();
  const groups = { "This Week": [], "Last Week": [], "2 Weeks Ago": [], "Older": [] };
  logs.forEach(log => {
    const d = new Date(log.date);
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays < 7) groups["This Week"].push(log);
    else if (diffDays < 14) groups["Last Week"].push(log);
    else if (diffDays < 21) groups["2 Weeks Ago"].push(log);
    else groups["Older"].push(log);
  });
  return groups;
}

function getLast30Days() {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const { logs } = useWorkout();
  const [splitFilter, setSplitFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const last30 = getLast30Days();

  const filtered = logs.filter(l => {
    const matchSplit = splitFilter === "All" || l.split === splitFilter;
    const matchDate = !dateFilter || l.date === dateFilter;
    return matchSplit && matchDate;
  });

  const grouped = groupByWeek(filtered);

  const logDates = new Set(logs.map(l => l.date));

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* Header */}
      <div style={{ padding: "16px 16px 0", display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Workout History</h1>
        <span style={{ fontSize: 12, background: "var(--primary)", color: "#fff", borderRadius: 12, padding: "2px 10px", fontWeight: 600 }}>
          {logs.length}
        </span>
      </div>

      {/* Summary stats */}
      <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "0 16px 14px" }}>
        {[
          { label: "This Month", value: `${mockStats.workouts_this_month} sessions` },
          { label: "Best Streak", value: `${mockStats.longest_streak} days` },
          { label: "Avg Duration", value: `${mockStats.avg_session_duration_min} min` },
        ].map(({ label, value }) => (
          <div key={label} style={{
            flexShrink: 0, background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)",
            padding: "10px 14px", minWidth: 120,
          }}>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{label}</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Calendar strip */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "0 16px 14px" }}>
        {last30.map(d => {
          const iso = d.toISOString().split("T")[0];
          const isToday = iso === new Date().toISOString().split("T")[0];
          const hasLog = logDates.has(iso);
          const isActive = dateFilter === iso;
          const log = logs.find(l => l.date === iso);
          return (
            <button key={iso} onClick={() => setDateFilter(isActive ? null : iso)} style={{
              flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center",
              gap: 4, padding: "6px 8px", borderRadius: 10,
              border: isToday ? "2px solid var(--primary)" : isActive ? "2px solid var(--primary)" : "1px solid var(--border)",
              background: isActive ? "var(--primary-glow)" : "var(--surface-raised)",
              cursor: "pointer",
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: isToday ? "var(--primary)" : "var(--text-primary)" }}>
                {d.getDate()}
              </span>
              <span style={{ fontSize: 9, color: "var(--text-muted)" }}>
                {d.toLocaleDateString("en-US", { weekday: "short" }).slice(0,3)}
              </span>
              {hasLog && (
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: getSplitColor(log?.split || "Push"),
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Split filter */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "0 16px 14px" }}>
        {SPLITS.map(s => (
          <button key={s} onClick={() => setSplitFilter(s)} style={{
            flexShrink: 0, padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500,
            border: splitFilter === s ? `2px solid ${getSplitColor(s)}` : "1px solid var(--border)",
            background: splitFilter === s ? `${getSplitColor(s)}22` : "var(--surface-raised)",
            color: splitFilter === s ? getSplitColor(s) : "var(--text-muted)",
            cursor: "pointer",
          }}>{s}</button>
        ))}
      </div>

      {/* Groups */}
      <div style={{ padding: "0 16px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ margin: "0 auto 16px" }}>
              <circle cx="32" cy="32" r="30" stroke="var(--border)" strokeWidth="2" />
              <path d="M20 32h24" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No workouts logged yet</p>
            <button onClick={() => navigate("/log")} style={{
              padding: "10px 20px", borderRadius: 10, border: "none",
              background: "var(--primary)", color: "#fff", fontSize: 14, cursor: "pointer",
            }}>Start your first session! →</button>
          </div>
        ) : (
          Object.entries(grouped).map(([week, wLogs]) => {
            if (!wLogs.length) return null;
            return (
              <div key={week} style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>{week}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {wLogs.map(log => (
                    <HistoryCard key={log.id} log={log} expanded={expanded === log.id} onToggle={() => setExpanded(expanded === log.id ? null : log.id)} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function HistoryCard({ log, expanded, onToggle }) {
  return (
    <div style={{ background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
      <button onClick={onToggle} style={{ width: "100%", padding: 14, background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, background: getSplitColor(log.split), color: "#fff",
              borderRadius: 6, padding: "2px 8px",
            }}>{log.split.toUpperCase()}</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {new Date(log.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </span>
          </div>
          {expanded ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
        </div>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
          {log.duration_min} min · {log.total_sets} sets · {log.exercises.length} exercises
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {log.exercises.slice(0, 3).map((ex, i) => (
            <span key={i} style={{ fontSize: 11, background: "var(--surface-raised)", borderRadius: 6, padding: "2px 8px", color: "var(--text-muted)" }}>{ex.name}</span>
          ))}
          {log.exercises.length > 3 && (
            <span style={{ fontSize: 11, background: "var(--surface-raised)", borderRadius: 6, padding: "2px 8px", color: "var(--primary)" }}>+{log.exercises.length - 3} more</span>
          )}
        </div>
      </button>

      {expanded && (
        <div style={{ borderTop: "1px solid var(--border)", padding: "12px 14px" }}>
          {log.exercises.map((ex, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>{ex.name}</p>
              {ex.sets.map((set, j) => (
                <p key={j} style={{ fontSize: 12, color: "var(--text-muted)", paddingLeft: 12, marginBottom: 2 }}>
                  Set {j + 1}: {set.reps} reps × {set.weight} kg
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
