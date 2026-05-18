import "server-only";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export class UnauthorizedError extends Error {
  constructor(message = "Not authorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class QuotaExceededError extends Error {
  constructor(message = "Quota exceeded") {
    super(message);
    this.name = "QuotaExceededError";
  }
}

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { user, supabase };
}

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { user, supabase };
}

export async function isAdmin(): Promise<boolean> {
  const { user } = await getUser();
  if (!user) return false;
  const role = (user.app_metadata as { role?: string } | null)?.role;
  return role === "admin";
}

export async function requireAdmin() {
  const adminFlag = await isAdmin();
  if (!adminFlag) {
    // Return 404 — don't advertise the route exists.
    const { notFound } = await import("next/navigation");
    notFound();
  }
}

/** Returns the user's tier as set by the Stripe webhook (defaults to free). */
export async function getEntitlements(): Promise<{
  tier: "free" | "pro";
  isPro: boolean;
}> {
  const { user } = await getUser();
  const tier =
    ((user?.app_metadata as { tier?: "free" | "pro" } | null)?.tier ?? "free") as
      | "free"
      | "pro";
  return { tier, isPro: tier === "pro" };
}

export async function assertPro() {
  const { isPro } = await getEntitlements();
  if (!isPro) throw new ForbiddenError("This feature requires a Pro subscription.");
}
