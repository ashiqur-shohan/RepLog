"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { updateNotificationPrefs, type NotificationPrefs } from "@/lib/actions/notifications";

interface NotificationToggle {
  key: keyof NotificationPrefs;
  label: string;
  description: string;
}

const TOGGLES: NotificationToggle[] = [
  {
    key: "email_enabled",
    label: "Email notifications",
    description: "Receive notifications via email",
  },
  {
    key: "push_enabled",
    label: "Push notifications",
    description: "Browser / device push alerts",
  },
  {
    key: "weekly_summary",
    label: "Weekly summary",
    description: "Your weekly volume and PR recap every Monday",
  },
  {
    key: "rest_reminder",
    label: "Rest timer reminder",
    description: "Chime when your rest period ends",
  },
];

interface NotificationTogglesProps {
  initialPrefs: NotificationPrefs;
}

export function NotificationToggles({ initialPrefs }: NotificationTogglesProps) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(initialPrefs);
  const [pending, startTransition] = useTransition();

  function handleToggle(key: keyof NotificationPrefs, value: boolean) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    startTransition(async () => {
      const result = await updateNotificationPrefs(next);
      if (!result.ok) {
        // Revert on failure
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
