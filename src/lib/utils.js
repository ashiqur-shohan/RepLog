import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9).toUpperCase();
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export function formatDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(date);
}

export function getDayName(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
}

export function getSplitColor(split) {
  const colors = {
    Push: "#EF4444",
    Pull: "#3B82F6",
    Legs: "#22C55E",
    "Core+Cardio": "#F59E0B",
    Core: "#F59E0B",
    Cardio: "#A855F7",
    Rest: "#6B7280",
  };
  return colors[split] || "#6B7280";
}
