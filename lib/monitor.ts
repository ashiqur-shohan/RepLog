/**
 * Light observability wrapper.
 *
 * - Always writes timing / events via lib/log.ts so Vercel ingests them.
 * - When Sentry is initialized (DSN present), also records spans / messages
 *   there. The Sentry calls are lazy-imported so that the module remains
 *   NO-OP in environments where @sentry/nextjs has not been configured.
 */

import { log } from "@/lib/log";

/** Run `fn`, record its wall-clock duration, and return its result. */
export async function withTiming<T>(
  name: string,
  fn: () => Promise<T>,
  context: Record<string, unknown> = {},
): Promise<T> {
  const start = Date.now();

  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    const Sentry = await import("@sentry/nextjs").catch(() => null);
    if (Sentry) {
      return Sentry.startSpan({ name, attributes: context as Record<string, string | number | boolean> }, async () => {
        const result = await fn();
        const durationMs = Date.now() - start;
        log.info(`[timing] ${name}`, { ...context, durationMs });
        return result;
      });
    }
  }

  // Sentry not available — plain timing
  try {
    const result = await fn();
    const durationMs = Date.now() - start;
    log.info(`[timing] ${name}`, { ...context, durationMs });
    return result;
  } catch (err) {
    const durationMs = Date.now() - start;
    log.error(`[timing] ${name} failed`, {
      ...context,
      durationMs,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

/** Emit a named event with arbitrary props for structured logging + Sentry. */
export async function recordEvent(
  name: string,
  props: Record<string, unknown> = {},
): Promise<void> {
  log.info(`[event] ${name}`, props);

  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    const Sentry = await import("@sentry/nextjs").catch(() => null);
    if (Sentry) {
      Sentry.captureMessage(name, {
        level: "info",
        extra: props,
      });
    }
  }
}
