import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { NotificationToggles } from "@/components/domain/settings/NotificationToggles";
import { getNotificationPrefs } from "@/lib/actions/notifications";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const prefs = await getNotificationPrefs();

  return (
    <div className="max-w-lg mx-auto px-5 pt-6 pb-12">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ChevronLeft size={16} />
        Settings
      </Link>
      <PageHeader title="Notifications" className="mb-6" />
      <NotificationToggles initialPrefs={prefs} />
    </div>
  );
}
