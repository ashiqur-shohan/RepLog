import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/domain/onboarding/OnboardingFlow";
import { requireUser } from "@/lib/guards";

export const metadata = { title: "Welcome to replog" };

export default async function OnboardingPage() {
  const { user, supabase } = await requireUser();

  const { data: raw } = await supabase
    .from("profiles")
    .select("onboarded_at")
    .eq("id", user.id)
    .single();

  const profile = raw as { onboarded_at: string | null } | null;

  if (profile?.onboarded_at) {
    redirect("/dashboard");
  }

  return (
    <div className="h-dvh max-w-md mx-auto">
      <OnboardingFlow />
    </div>
  );
}
