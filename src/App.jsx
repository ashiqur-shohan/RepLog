import { BrowserRouter, Routes, Route, useLocation, NavLink } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutGrid, PlusCircle, Clock, BookOpen, User } from "lucide-react";
import { ThemeProvider } from "./context/ThemeContext";
import { WorkoutProvider } from "./context/WorkoutContext";
import Dashboard from "./pages/Dashboard";
import LogPage from "./pages/LogPage";
import HistoryPage from "./pages/HistoryPage";
import LibraryPage from "./pages/LibraryPage";
import ProfilePage from "./pages/ProfilePage";
import { mockWorkoutLogs } from "./data/mockData";

const tabs = [
  { to: "/",        icon: LayoutGrid, label: "Home" },
  { to: "/log",     icon: PlusCircle, label: "Log" },
  { to: "/history", icon: Clock,      label: "History" },
  { to: "/library", icon: BookOpen,   label: "Library" },
  { to: "/profile", icon: User,       label: "Profile" },
];

function todayLogged() {
  const today = new Date().toISOString().split("T")[0];
  return mockWorkoutLogs.some(l => l.date === today);
}

function BottomNav() {
  const location = useLocation();
  const hasUnlogged = !todayLogged();
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: "rgba(19,19,26,0.85)",
      backdropFilter: "blur(12px)",
      borderTop: "1px solid var(--border)",
      paddingBottom: "env(safe-area-inset-bottom)",
      zIndex: 50,
    }}>
      <div style={{ display: "flex", justifyContent: "space-around", padding: "8px 0" }}>
        {tabs.map(({ to, icon: Icon, label }) => {
          const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
          return (
            <NavLink key={to} to={to} style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                transform: active ? "scale(1.1)" : "scale(1)",
                transition: "transform 0.2s",
              }}>
                <div style={{ position: "relative" }}>
                  <Icon size={22} color={active ? "var(--primary)" : "var(--text-muted)"} strokeWidth={active ? 2.5 : 1.8} />
                  {to === "/log" && hasUnlogged && (
                    <span style={{
                      position: "absolute", top: -2, right: -2,
                      width: 7, height: 7, borderRadius: "50%",
                      background: "var(--danger)",
                      border: "1.5px solid var(--background)",
                    }} />
                  )}
                </div>
                <span style={{
                  fontSize: 10, fontWeight: active ? 600 : 400,
                  color: active ? "var(--primary)" : "var(--text-muted)",
                }}>{label}</span>
              </div>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25 }}
        style={{ paddingBottom: 80 }}
      >
        <Routes location={location}>
          <Route path="/"        element={<Dashboard />} />
          <Route path="/log"     element={<LogPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <WorkoutProvider>
        <BrowserRouter>
          <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100svh", background: "var(--background)" }}>
            <AnimatedRoutes />
            <BottomNav />
          </div>
          <Toaster
            position="top-center"
            toastOptions={{
              style: { background: "var(--surface-raised)", color: "var(--text-primary)", border: "1px solid var(--border)" },
              duration: 3000,
            }}
          />
        </BrowserRouter>
      </WorkoutProvider>
    </ThemeProvider>
  );
}
