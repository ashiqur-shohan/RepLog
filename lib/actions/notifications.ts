"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/guards";
import { actionErr, actionOk, type ActionResult } from "@/lib/actions/types";

// Schema mirrors the notification_prefs table columns exactly.
const notificationPrefsSchema = z.object({
  email_workout_reminders: z.boolean(),
  email_weekly_digest: z.boolean(),
  email_marketing: z.boolean(),
  push_workout_reminders: z.boolean(),
  rest_timer_seconds: z.number().int().min(0).max(600),
});

export type NotificationPrefs = z.infer<typeof notificationPrefsSchema>;

export async function updateNotificationPrefs(
  prefs: NotificationPrefs,
): Promise<ActionResult<void>> {
  const parsed = notificationPrefsSchema.safeParse(prefs);
  if (!parsed.success) return actionErr("Invalid input");

  const { user, supabase } = await requireUser();

  const { error } = await supabase.from("notification_prefs").upsert(
    {
      user_id: user.id,
      ...parsed.data,
      updated_at: new Date().toISOString(),
    } as never,
    { onConflict: "user_id" },
  );

  if (error) return actionErr(error.message);
  revalidatePath("/settings/notifications");
  return actionOk(undefined);
}

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  const { user, supabase } = await requireUser();

  const { data: raw } = await supabase
    .from("notification_prefs")
    .select(
      "email_workout_reminders, email_weekly_digest, email_marketing, push_workout_reminders, rest_timer_seconds",
    )
    .eq("user_id", user.id)
    .single();

  const data = raw as NotificationPrefs | null;

  return {
    email_workout_reminders: data?.email_workout_reminders ?? true,
    email_weekly_digest: data?.email_weekly_digest ?? true,
    email_marketing: data?.email_marketing ?? false,
    push_workout_reminders: data?.push_workout_reminders ?? false,
    rest_timer_seconds: data?.rest_timer_seconds ?? 90,
  };
}
