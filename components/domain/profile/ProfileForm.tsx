"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { updateProfile, uploadAvatar, deleteAccount } from "@/lib/actions/profile";

type Goal = "build_muscle" | "get_stronger" | "stay_consistent" | "lose_weight";
type WeightUnit = "kg" | "lb";
type Gender = "male" | "female" | "other" | "prefer_not_to_say";

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

interface ProfileFormProps {
  profile: ProfileData;
  email: string;
}

const GOAL_LABELS: Record<Goal, string> = {
  build_muscle: "Build muscle",
  get_stronger: "Get stronger",
  stay_consistent: "Stay consistent",
  lose_weight: "Lose weight",
};

const GENDER_LABELS: Record<Gender, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
  prefer_not_to_say: "Prefer not to say",
};

export function ProfileForm({ profile, email }: ProfileFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [avatarPending, startAvatarTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const displayName = profile.display_name ?? email.split("@")[0] ?? "Athlete";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const currentWeightUnit = (profile.weight_unit as WeightUnit) ?? "kg";
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(currentWeightUnit);

  function handleAvatarClick() {
    fileInputRef.current?.click();
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.set("avatar", file);
    startAvatarTransition(async () => {
      const result = await uploadAvatar(fd);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setAvatarUrl(result.data.url);
      toast.success("Avatar updated.");
    });
  }

  function handleSubmit(formData: FormData) {
    setErrors({});
    formData.set("weight_unit", weightUnit);
    startTransition(async () => {
      const result = await updateProfile(formData);
      if (!result.ok) {
        toast.error(result.error);
        if (result.fieldErrors) setErrors(result.fieldErrors);
        return;
      }
      toast.success("Profile saved.");
      router.refresh();
    });
  }

  function handleDeleteAccount() {
    startDeleteTransition(async () => {
      const result = await deleteAccount();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.replace("/");
    });
  }

  const timezones =
    typeof Intl !== "undefined" && "supportedValuesOf" in Intl
      ? Intl.supportedValuesOf("timeZone")
      : [];

  return (
    <div className="space-y-8">
      {/* Avatar section */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-16 w-16">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
            <AvatarFallback className="text-xl">{initials}</AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={handleAvatarClick}
            disabled={avatarPending}
            aria-label="Change avatar"
            className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            <Camera size={12} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handleAvatarChange}
          />
        </div>
        <div>
          <div className="font-medium">{displayName}</div>
          <div className="text-xs text-muted-foreground">{email}</div>
          <button
            type="button"
            onClick={handleAvatarClick}
            disabled={avatarPending}
            className="text-xs text-primary mt-1 hover:underline"
          >
            {avatarPending ? "Uploading…" : "Change avatar"}
          </button>
        </div>
      </div>

      {/* Profile form */}
      <form action={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="display_name">Display name</Label>
          <Input
            id="display_name"
            name="display_name"
            defaultValue={profile.display_name ?? ""}
            required
            className="mt-1"
            aria-invalid={!!errors.display_name}
            aria-describedby={errors.display_name ? "display_name-error" : undefined}
          />
          {errors.display_name && (
            <p id="display_name-error" className="text-xs text-destructive mt-1">
              {errors.display_name[0]}
            </p>
          )}
        </div>

        {/* Goal */}
        <div>
          <Label htmlFor="goal">Goal</Label>
          <select
            id="goal"
            name="goal"
            defaultValue={profile.goal ?? ""}
            className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-input text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Select a goal</option>
            {(Object.entries(GOAL_LABELS) as [Goal, string][]).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Weight unit segmented control */}
        <div>
          <Label>Weight unit</Label>
          <div className="mt-1 flex gap-1 bg-muted rounded-md p-0.5 w-fit">
            {(["kg", "lb"] as WeightUnit[]).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setWeightUnit(u)}
                className={`px-4 py-1.5 rounded text-sm font-mono transition-colors ${
                  weightUnit === u
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        {/* Timezone */}
        <div>
          <Label htmlFor="timezone">Timezone</Label>
          {timezones.length > 0 ? (
            <select
              id="timezone"
              name="timezone"
              defaultValue={profile.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone}
              className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-input text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          ) : (
            <Input
              id="timezone"
              name="timezone"
              defaultValue={profile.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone}
              className="mt-1"
              placeholder="Asia/Dhaka"
            />
          )}
        </div>

        {/* Date of birth */}
        <div>
          <Label htmlFor="date_of_birth">Date of birth</Label>
          <Input
            id="date_of_birth"
            name="date_of_birth"
            type="date"
            defaultValue={profile.date_of_birth ?? ""}
            className="mt-1"
            aria-invalid={!!errors.date_of_birth}
          />
          {errors.date_of_birth && (
            <p className="text-xs text-destructive mt-1">{errors.date_of_birth[0]}</p>
          )}
        </div>

        {/* Gender */}
        <div>
          <Label htmlFor="gender">Gender</Label>
          <select
            id="gender"
            name="gender"
            defaultValue={profile.gender ?? ""}
            className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-input text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Prefer not to say</option>
            {(Object.entries(GENDER_LABELS) as [Gender, string][]).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Saving…" : "Save profile"}
        </Button>
      </form>

      <Separator />

      {/* Danger zone */}
      <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5">
        <div className="text-xs text-destructive uppercase tracking-widest font-mono">
          Danger zone
        </div>
        <div className="text-sm font-medium mt-1">Delete account</div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Soft-deletes all your data. Purged after 30 days.
        </p>
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              Delete account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete account?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              This will soft-delete all your data. Your account will be purged after 30 days.
              This action cannot be undone.
            </p>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" size="sm">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteAccount}
                disabled={deletePending}
              >
                {deletePending ? "Deleting…" : "Yes, delete my account"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
