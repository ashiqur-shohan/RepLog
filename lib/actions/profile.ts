"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/guards";
import { log } from "@/lib/log";
import { onboardingSchema, profileUpdateSchema } from "@/lib/validators/profile";
import { actionErr, actionOk, type ActionResult } from "@/lib/actions/types";

export async function updateProfile(formData: FormData): Promise<ActionResult<void>> {
  const { user, supabase } = await requireUser();
  const raw = {
    display_name: formData.get("display_name"),
    weight_unit: formData.get("weight_unit"),
    timezone: formData.get("timezone"),
    date_of_birth: formData.get("date_of_birth") || undefined,
    height_cm: formData.get("height_cm") ? Number(formData.get("height_cm")) : undefined,
    gender: formData.get("gender") || undefined,
  };
  const parsed = profileUpdateSchema.safeParse(raw);
  if (!parsed.success) return actionErr("Invalid input", parsed.error.flatten().fieldErrors);

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.display_name,
      weight_unit: parsed.data.weight_unit,
      timezone: parsed.data.timezone,
      date_of_birth: parsed.data.date_of_birth || null,
      height_cm: typeof parsed.data.height_cm === "number" ? parsed.data.height_cm : null,
      gender: parsed.data.gender || null,
    })
    .eq("id", user.id);

  if (error) {
    log.error("profile update failed", { userId: user.id, reason: error.message });
    return actionErr("Could not update profile");
  }
  revalidatePath("/app/profile");
  revalidatePath("/app", "layout");
  return actionOk(undefined);
}

export async function completeOnboarding(formData: FormData): Promise<ActionResult<void>> {
  const { user, supabase } = await requireUser();
  const parsed = onboardingSchema.safeParse({
    goal: formData.get("goal"),
    weight_unit: formData.get("weight_unit"),
    experience: formData.get("experience"),
  });
  if (!parsed.success) return actionErr("Invalid input", parsed.error.flatten().fieldErrors);

  const { error } = await supabase
    .from("profiles")
    .update({
      weight_unit: parsed.data.weight_unit,
      goal: parsed.data.goal,
      experience: parsed.data.experience,
      onboarded_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return actionErr("Could not save onboarding");
  revalidatePath("/app", "layout");
  return actionOk(undefined);
}

export async function uploadAvatar(formData: FormData): Promise<ActionResult<{ url: string }>> {
  const { user, supabase } = await requireUser();
  const file = formData.get("avatar");
  if (!(file instanceof File)) return actionErr("No file provided");
  if (file.size > 2 * 1024 * 1024) return actionErr("File must be under 2 MB");
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return actionErr("Unsupported file type");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "webp";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (upErr) return actionErr(upErr.message);

  const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
  const { error: profErr } = await supabase
    .from("profiles")
    .update({ avatar_url: pub.publicUrl })
    .eq("id", user.id);
  if (profErr) return actionErr(profErr.message);

  revalidatePath("/app", "layout");
  return actionOk({ url: pub.publicUrl });
}

export async function deleteAccount(): Promise<ActionResult<void>> {
  const { user, supabase } = await requireUser();
  // Soft-delete by marking profile; cascades happen via on delete cascade on auth.users.
  // To fully delete, an admin must remove the auth.users row server-side.
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: "[deleted]" })
    .eq("id", user.id);
  if (error) return actionErr(error.message);
  await supabase.auth.signOut();
  return actionOk(undefined);
}
