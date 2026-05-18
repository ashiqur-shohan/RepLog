import Link from "next/link";
import type { ReactNode } from "react";
import { BottomNav } from "@/components/shared/bottom-nav";
import { Sidebar } from "@/components/shared/sidebar";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getEntitlements, requireUser } from "@/lib/guards";
import { isAdmin } from "@/lib/guards";

export async function AppShell({ children }: { children: ReactNode }) {
  const { user, supabase } = await requireUser();
  const [{ data: profile }, entitlements, admin] = await Promise.all([
    supabase.from("profiles").select("display_name, avatar_url, weight_unit").eq("id", user.id).single(),
    getEntitlements(),
    isAdmin(),
  ]);

  const displayName = profile?.display_name ?? user.email?.split("@")[0] ?? "Athlete";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[240px_1fr]">
      <Sidebar
        displayName={displayName}
        email={user.email ?? ""}
        tier={entitlements.tier}
        showAdmin={admin}
      />
      <div className="flex flex-col min-h-dvh">
        {/* mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-5 pt-3 pb-3 border-b border-border safe-top">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary grid place-items-center font-mono font-semibold text-primary-foreground">
              R
            </div>
            <span className="font-semibold">replog</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/profile" aria-label="Profile">
              <Avatar className="h-9 w-9">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </header>

        <main className="flex-1 pb-24 md:pb-12">{children}</main>

        <BottomNav showAdmin={admin} />
      </div>
    </div>
  );
}
