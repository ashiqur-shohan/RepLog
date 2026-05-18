/**
 * Structured logger emitting one JSON object per line for Vercel to ingest.
 * Use this instead of console.log for anything production-relevant.
 */
type Level = "debug" | "info" | "warn" | "error";

interface LogContext {
  userId?: string;
  requestId?: string;
  route?: string;
  durationMs?: number;
  [key: string]: unknown;
}

function emit(level: Level, message: string, context: LogContext = {}) {
  const entry = {
    level,
    msg: message,
    ts: new Date().toISOString(),
    ...context,
  };
  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.info(line);
  }
}

export const log = {
  debug: (msg: string, ctx?: LogContext) => emit("debug", msg, ctx),
  info: (msg: string, ctx?: LogContext) => emit("info", msg, ctx),
  warn: (msg: string, ctx?: LogContext) => emit("warn", msg, ctx),
  error: (msg: string, ctx?: LogContext) => emit("error", msg, ctx),
};
