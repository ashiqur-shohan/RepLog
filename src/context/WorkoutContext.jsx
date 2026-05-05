import { createContext, useContext, useState, useEffect } from "react";
import { mockWorkoutLogs, mockWeeklyPlan } from "../data/mockData";
import { generateId } from "../lib/utils";

const WorkoutContext = createContext(null);

export function WorkoutProvider({ children }) {
  const [logs, setLogs] = useState(mockWorkoutLogs);
  const [weeklyPlan, setWeeklyPlan] = useState(() => {
    try {
      const saved = localStorage.getItem("replog-weekly-plan");
      return saved ? JSON.parse(saved) : mockWeeklyPlan;
    } catch { return mockWeeklyPlan; }
  });

  const saveWorkoutLog = (logData) => {
    const newLog = { id: generateId(), ...logData };
    setLogs(prev => [newLog, ...prev]);
    return Promise.resolve(newLog);
  };

  const updateWeeklyPlan = (plan) => {
    setWeeklyPlan(plan);
    localStorage.setItem("replog-weekly-plan", JSON.stringify(plan));
    return Promise.resolve(plan);
  };

  return (
    <WorkoutContext.Provider value={{ logs, weeklyPlan, saveWorkoutLog, updateWeeklyPlan }}>
      {children}
    </WorkoutContext.Provider>
  );
}

export const useWorkout = () => useContext(WorkoutContext);
