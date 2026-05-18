"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { updateNotificationPrefs, type NotificationPrefs } from "@/lib/actions/notifications";

type BooleanKey = {
  [K in keyof NotificationPrefs]: NotificationPrefs[K] extends boolean ? K : never;
}[keyof NotificationPrefs];

interface NotificationToggle {
  key: BooleanKey;
  label: string;
  description: string;
}

const TOGGLES: NotificationToggle[] = [
  {
    key: "email_workout_reminders",
    label: "Workout reminders (email)",
    description: "Email nudges to keep your streak alive",
  },
  {
    key: "email_weekly_digest",
    label: "Weekly digest (email)",
    description: "Your weekly volume and PR recap every Monday",
  },
  {
    key: "email_marketing",
    label: "Product news (email)",
    description: "Occasional updates about new features",
  },
  {
    key: "push_workout_reminders",
    label: "Workout reminders (push)",
    description: "Browser / device push alerts",
  },
];

interface NotificationTogglesProps {
  initialPrefs: NotificationPrefs;
}

export function NotificationToggles({ initialPrefs }: NotificationTogglesProps) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(initialPrefs);
  const [pending, startTransition] = useTransition();

  function handleToggle(key: BooleanKey, value: boolean) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    startTransition(async () => {
      const result = await updateNotificationPrefs(next);
      if (!result.ok) {
        setPrefs(prefs);
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-1">
      {TOGGLES.map(({ key, label, description }) => (
        <div
          key={key}
          className="flex items-center justify-between p-4 rounded-lg bg-card border border-border"
        >
          <div className="space-y-0.5">
            <Label htmlFor={`toggle-${key}`} className="text-sm font-medium cursor-pointer">
              {label}
            </Label>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <Switch
            id={`toggle-${key}`}
            checked={prefs[key]}
            onCheckedChange={(checked) => handleToggle(key, checked)}
            disabled={pending}
          />
        </div>
      ))}
    </div>
  );
}
