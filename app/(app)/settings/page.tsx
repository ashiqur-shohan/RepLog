import Link from "next/link";
import { ChevronRight, User, Bell, CreditCard, Shield } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";

export const metadata = { title: "Settings" };

const SETTING_GROUPS = [
  {
    href: "/profile",
    icon: User,
    title: "Profile",
    description: "Name, avatar, goal, units",
  },
  {
    href: "/settings/notifications",
    icon: Bell,
    title: "Notifications",
    description: "Email, push, weekly digest",
  },
  {
    href: "/settings/billing",
    icon: CreditCard,
    title: "Billing",
    description: "Plan, invoices, Stripe portal",
  },
  {
    href: "/profile#danger",
    icon: Shield,
    title: "Account",
    description: "Delete account, privacy",
  },
] as const;

export default function SettingsPage() {
  return (
    <div className="max-w-lg mx-auto px-5 pt-6 pb-12">
      <PageHeader title="Settings" className="mb-6" />

      <div className="space-y-2">
        {SETTING_GROUPS.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border hover:border-muted-foreground/40 transition-colors"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground shrink-0">
              <Icon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{title}</div>
              <div className="text-xs text-muted-foreground">{description}</div>
            </div>
            <ChevronRight size={16} className="text-muted-foreground shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
