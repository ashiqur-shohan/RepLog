"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { checkLimit } from "@/lib/ratelimit";
import { log } from "@/lib/log";
import { loginSchema, signupSchema, forgotPasswordSchema } from "@/lib/validators/auth";
import { actionErr, actionOk, type ActionResult } from "@/lib/actions/types";

async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "0.0.0.0"
  );
}

export async function signUpWithPassword(formData: FormData): Promise<ActionResult<{ userId: string }>> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return actionErr("Invalid input", parsed.error.flatten().fieldErrors);
  }

  const ip = await clientIp();
  const limit = await checkLimit("auth-signup", ip, 5, 60);
  if (!limit.ok) return actionErr("Too many attempts. Try again in a minute.");

  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_APP_URL;

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error || !data.user) {
    log.warn("signup failed", { reason: error?.message });
    return actionErr(error?.message ?? "Could not create account");
  }

  return actionOk({ userId: data.user.id });
}

export async function signInWithPassword(formData: FormData): Promise<ActionResult<void>> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return actionErr("Invalid input", parsed.error.flatten().fieldErrors);
  }

  const ip = await clientIp();
  const limit = await checkLimit("auth-login", ip, 5, 60);
  if (!limit.ok) return actionErr("Too many attempts. Try again in a minute.");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    log.warn("login failed", { reason: error.message });
    return actionErr("Invalid email or password");
  }
  return actionOk(undefined);
}

export async function signInWithGoogle(): Promise<ActionResult<{ url: string }>> {
  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_APP_URL;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback`, queryParams: { prompt: "select_account" } },
  });
  if (error || !data.url) return actionErr(error?.message ?? "OAuth failed");
  return actionOk({ url: data.url });
}

export async function requestPasswordReset(formData: FormData): Promise<ActionResult<void>> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return actionErr("Invalid input", parsed.error.flatten().fieldErrors);

  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_APP_URL;
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/app/settings`,
  });
  if (error) return actionErr(error.message);
  return actionOk(undefined);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
