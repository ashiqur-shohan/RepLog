import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from "recharts";
import { Flame, Dumbbell, Zap, Clock, ChevronRight, Edit2 } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useWorkout } from "../context/WorkoutContext";
import { mockUser, mockStats, mockBodyMetrics, mockExercises } from "../data/mockData";
import { getGreeting, formatDate, getDayName, getSplitColor } from "../lib/utils";
import WeeklyPlanEditor from "../components/WeeklyPlanEditor";
import { Sun, Moon } from "lucide-react";

const S = {
  page: { padding: "16px", display: "flex", flexDirection: "column", gap: 24 },
  sectionTitle: {
    fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
    color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 12,
  },
  card: {
    background: "var(--surface)", borderRadius: 16,
    border: "1px solid var(--border)", padding: 16,
  },
};

function SectionTitle({ children }) {
  return <p style={S.sectionTitle}>{children}</p>;
}

function StatCard({ icon: Icon, value, label, color, glow }) {
  return (
    <div style={{
      minWidth: 100, background: "var(--surface)", borderRadius: 16,
      border: `1px solid var(--border)`, padding: "14px 16px",
      display: "flex", flexDirection: "column", gap: 6,
      boxShadow: glow ? `0 0 16px ${glow}` : "none",
      flexShrink: 0,
    }}>
      <Icon size={18} color={color} />
      <span style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>{value}</span>
      <span style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.3 }}>{label}</span>
    </div>
  );
}

const DAYS = ["Saturday","Sunday","Monday","Tuesday","Wednesday","Thursday","Friday"];

function WeeklyStrip({ plan, todayName, logs, onEdit }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <SectionTitle>Weekly Overview</SectionTitle>
        <button onClick={onEdit} style={{
          background: "none", border: "1px solid var(--border)", borderRadius: 8,
          padding: "4px 10px", color: "var(--text-muted)", fontSize: 12,
          cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
        }}>
          <Edit2 size={12} /> Edit Plan
        </button>
      </div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {DAYS.map(day => {
          const dayData = plan.days[day];
          const isToday = day === todayName;
          const abbr = day.slice(0, 3);
          const loggedToday = logs.some(l => {
            const d = new Date(l.date);
            const dayOfWeek = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(d);
            return dayOfWeek === day && l.split !== "Rest";
          });
          return (
            <div key={day} style={{
              minWidth: 52, display: "flex", flexDirection: "column", alignItems: "center",
              gap: 6, flexShrink: 0,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: isToday ? "var(--primary-glow)" : "var(--surface-raised)",
                border: isToday ? "2px solid var(--primary)" : "1px solid var(--border)",
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", position: "relative",
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: dayData?.color || "#6B7280",
                  marginBottom: 2,
                }} />
                <span style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 500 }}>
                  {dayData?.split?.slice(0,4) || "Rest"}
                </span>
                {loggedToday && (
                  <span style={{
                    position: "absolute", top: -4, right: -4, fontSize: 10,
                  }}>✓</span>
                )}
              </div>
              <span style={{
                fontSize: 10, color: isToday ? "var(--primary)" : "var(--text-muted)",
                fontWeight: isToday ? 600 : 400,
              }}>{abbr}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px" }}>
      <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--primary)" }}>{payload[0].value.toLocaleString()} kg</p>
    </div>
  );
};

const CustomLineTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px" }}>
      <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--primary)" }}>{payload[0].value} kg</p>
    </div>
  );
};

function MuscleFrequency({ logs }) {
  const counts = { Push: 0, Pull: 0, Legs: 0, Core: 0 };
  logs.slice(0, 7).forEach(l => {
    if (l.split === "Push") counts.Push++;
    else if (l.split === "Pull") counts.Pull++;
    else if (l.split === "Legs") counts.Legs++;
    else if (l.split === "Core+Cardio" || l.split === "Core") counts.Core++;
  });
  const max = Math.max(...Object.values(counts), 1);
  const colors = { Push: "#EF4444", Pull: "#3B82F6", Legs: "#22C55E", Core: "#F59E0B" };
  return (
    <div style={S.card}>
      <SectionTitle>Muscle Group Frequency (Recent)</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {Object.entries(counts).map(([cat, count]) => (
          <div key={cat} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)", width: 36 }}>{cat}</span>
            <div style={{ flex: 1, background: "var(--surface-raised)", borderRadius: 4, height: 8, overflow: "hidden" }}>
              <div style={{
                width: `${(count / max) * 100}%`, height: "100%",
                background: colors[cat], borderRadius: 4,
                transition: "width 0.5s ease",
              }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", width: 24, textAlign: "right" }}>{count}x</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const { logs, weeklyPlan } = useWorkout();
  const [showEditor, setShowEditor] = useState(false);
  const [loading, setLoading] = useState(true);

  const todayName = getDayName();
  const todayPlan = weeklyPlan.days[todayName];
  const todayExercises = (todayPlan?.exercises || []).map(id => mockExercises.find(e => e.id === id)).filter(Boolean);
  const recentLogs = logs.slice(0, 3);

  const startWeight = mockBodyMetrics[0].weight_kg;
  const currentWeight = mockBodyMetrics[mockBodyMetrics.length - 1].weight_kg;
  const delta = (currentWeight - startWeight).toFixed(1);

  const metricsForChart = mockBodyMetrics.map(m => ({
    date: m.date.slice(5),
    weight: m.weight_kg,
  }));

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  if (loading) return <SkeletonDashboard />;

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>
            {getGreeting()}, {mockUser.name.split(" ")[0]} 👋
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{formatDate()}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={toggle} style={{
            background: "var(--surface-raised)", border: "1px solid var(--border)",
            borderRadius: 10, padding: 8, cursor: "pointer", color: "var(--text-muted)",
            display: "flex",
          }}>
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "var(--primary)", display: "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: "#fff",
            boxShadow: "0 0 20px var(--primary-glow)",
          }}>
            {mockUser.avatar_initials}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div>
        <SectionTitle>Quick Stats</SectionTitle>
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
          <StatCard icon={Flame} value={`${mockStats.current_streak}d`} label="Streak" color="#F97316" glow="rgba(249,115,22,0.2)" />
          <StatCard icon={Dumbbell} value={mockStats.total_workouts_all_time} label="Sessions" color="var(--primary)" />
          <StatCard icon={Zap} value={`${mockStats.completion_rate_percent}%`} label="Completion" color="var(--success)" />
          <StatCard icon={Clock} value={`${mockStats.avg_session_duration_min}m`} label="Avg Duration" color="var(--warning)" />
        </div>
      </div>

      {/* Today's Plan */}
      <div style={S.card}>
        <SectionTitle>Today's Plan</SectionTitle>
        {todayPlan?.split === "Rest" ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <p style={{ fontSize: 28 }}>😴</p>
            <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginTop: 8 }}>Rest Day</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Recovery is growth</p>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{
                background: todayPlan?.color || "var(--primary)", color: "#fff",
                borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700,
                letterSpacing: "0.05em",
              }}>
                {todayPlan?.split?.toUpperCase() || "WORKOUT"}
              </span>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{todayExercises.length} exercises</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 160, overflowY: "auto", marginBottom: 14 }}>
              {todayExercises.map(ex => (
                <div key={ex.id} style={{ fontSize: 13, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: todayPlan?.color, flexShrink: 0 }} />
                  {ex.name}
                </div>
              ))}
            </div>
            <button onClick={() => navigate("/log")} style={{
              width: "100%", minHeight: 48, background: "var(--primary)",
              color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600,
              cursor: "pointer", boxShadow: "0 0 20px var(--primary-glow)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            }}>
              Start Workout <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>

      {/* Weekly Strip */}
      <div style={S.card}>
        <WeeklyStrip plan={weeklyPlan} todayName={todayName} logs={logs} onEdit={() => setShowEditor(true)} />
      </div>

      {/* Volume Chart */}
      <div style={S.card}>
        <SectionTitle>Training Volume (kg)</SectionTitle>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={mockStats.weekly_volume_trend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6C63FF" stopOpacity={1} />
                <stop offset="100%" stopColor="#6C63FF" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <XAxis dataKey="week" tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomBarTooltip />} />
            <Bar dataKey="volume" fill="url(#volGrad)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Weight Chart */}
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <SectionTitle>Weight Progress</SectionTitle>
          <span style={{
            fontSize: 13, fontWeight: 600,
            color: delta < 0 ? "var(--success)" : "var(--danger)",
            background: delta < 0 ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
            borderRadius: 6, padding: "2px 8px",
          }}>
            {delta > 0 ? "+" : ""}{delta} kg
          </span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={metricsForChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6C63FF" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#6C63FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
            <Tooltip content={<CustomLineTooltip />} />
            <Area type="monotone" dataKey="weight" stroke="#6C63FF" strokeWidth={2} fill="url(#weightGrad)" dot={{ r: 3, fill: "#6C63FF" }} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Sessions */}
      <div>
        <SectionTitle>Recent Sessions</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {recentLogs.map(log => (
            <div key={log.id} onClick={() => navigate("/history")} style={{ ...S.card, cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
                    background: getSplitColor(log.split), color: "#fff",
                    borderRadius: 6, padding: "2px 8px",
                  }}>{log.split.toUpperCase()}</span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {new Date(log.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                </div>
                <ChevronRight size={14} color="var(--text-muted)" />
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
                {log.duration_min} min · {log.total_sets} sets · {log.exercises.length} exercises
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {log.exercises.slice(0, 3).map((ex, i) => (
                  <span key={i} style={{
                    fontSize: 11, background: "var(--surface-raised)",
                    borderRadius: 6, padding: "2px 8px", color: "var(--text-muted)",
                  }}>{ex.name}</span>
                ))}
                {log.exercises.length > 3 && (
                  <span style={{
                    fontSize: 11, background: "var(--surface-raised)",
                    borderRadius: 6, padding: "2px 8px", color: "var(--primary)",
                  }}>+{log.exercises.length - 3} more</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Muscle Frequency */}
      <MuscleFrequency logs={logs} />

      {showEditor && <WeeklyPlanEditor onClose={() => setShowEditor(false)} />}
    </div>
  );
}

function SkeletonDashboard() {
  const shimmer = {
    background: "linear-gradient(90deg, var(--surface) 25%, var(--surface-raised) 50%, var(--surface) 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.2s infinite",
    borderRadius: 12,
  };
  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 24 }}>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      <div style={{ height: 60, ...shimmer }} />
      <div style={{ display: "flex", gap: 10 }}>
        {[1,2,3,4].map(i => <div key={i} style={{ height: 90, flex: 1, ...shimmer }} />)}
      </div>
      <div style={{ height: 160, ...shimmer }} />
      <div style={{ height: 200, ...shimmer }} />
    </div>
  );
}
