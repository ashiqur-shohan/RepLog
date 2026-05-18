"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/guards";
import { actionErr, actionOk, type ActionResult } from "@/lib/actions/types";

const notificationPrefsSchema = z.object({
  email_enabled: z.boolean(),
  push_enabled: z.boolean(),
  weekly_summary: z.boolean(),
  rest_reminder: z.boolean(),
});

export type NotificationPrefs = z.infer<typeof notificationPrefsSchema>;

interface NotificationPrefsRow {
  email_enabled: boolean;
  push_enabled: boolean;
  weekly_summary: boolean;
  rest_reminder: boolean;
}

export async function updateNotificationPrefs(
  prefs: NotificationPrefs,
): Promise<ActionResult<void>> {
  const parsed = notificationPrefsSchema.safeParse(prefs);
  if (!parsed.success) return actionErr("Invalid input");

  const { user, supabase } = await requireUser();

  const { error } = await supabase
    .from("notification_prefs")
    .upsert(
      {
        user_id: user.id,
        email_enabled: parsed.data.email_enabled,
        push_enabled: parsed.data.push_enabled,
        weekly_summary: parsed.data.weekly_summary,
        rest_reminder: parsed.data.rest_reminder,
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: "user_id" },
    );

  if (error) return actionErr(error.message);
  revalidatePath("/app/settings/notifications");
  return actionOk(undefined);
}

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  const { user, supabase } = await requireUser();

  const { data: raw } = await supabase
    .from("notification_prefs")
    .select("email_enabled, push_enabled, weekly_summary, rest_reminder")
    .eq("user_id", user.id)
    .single();

  const data = raw as NotificationPrefsRow | null;

  return {
    email_enabled: data?.email_enabled ?? true,
    push_enabled: data?.push_enabled ?? false,
    weekly_summary: data?.weekly_summary ?? true,
    rest_reminder: data?.rest_reminder ?? true,
  };
}
