import { PageHeader } from "@/components/shared/PageHeader";
import { ProfileForm } from "@/components/domain/profile/ProfileForm";
import { requireUser } from "@/lib/guards";

export const metadata = { title: "Profile" };

interface ProfileData {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  weight_unit: string | null;
  timezone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  goal: string | null;
}

export default async function ProfilePage() {
  const { user, supabase } = await requireUser();

  const { data: raw } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, weight_unit, timezone, date_of_birth, gender, goal")
    .eq("id", user.id)
    .single();

  const profile: ProfileData = (raw as ProfileData | null) ?? {
    id: user.id,
    display_name: null,
    avatar_url: null,
    weight_unit: "kg",
    timezone: null,
    date_of_birth: null,
    gender: null,
    goal: null,
  };

  return (
    <div className="max-w-lg mx-auto px-5 pt-6 pb-12">
      <PageHeader title="Profile" className="mb-6" />
      <ProfileForm profile={profile} email={user.email ?? ""} />
    </div>
  );
}
