"use client";

import { Dumbbell, History, Home, LineChart, ListChecks, Settings, Shield, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/library", label: "Library", icon: Dumbbell },
  { href: "/plans", label: "Plans", icon: ListChecks },
  { href: "/history", label: "History", icon: History },
  { href: "/progress", label: "Progress", icon: LineChart },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  displayName,
  email,
  tier,
  showAdmin,
}: {
  displayName: string;
  email: string;
  tier: "free" | "pro";
  showAdmin: boolean;
}) {
  const pathname = usePathname() ?? "";
  return (
    <aside className="hidden md:flex md:flex-col border-r border-border px-4 py-6 sticky top-0 h-dvh">
      <Link href="/dashboard" className="flex items-center gap-2 mb-8 px-2">
        <div className="w-8 h-8 rounded-md bg-primary grid place-items-center font-mono font-semibold text-primary-foreground">
          R
        </div>
        <span className="font-semibold">replog</span>
      </Link>
      <nav className="space-y-1 text-sm" aria-label="Main">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </Link>
          );
        })}
        {showAdmin && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
              pathname.startsWith("/admin")
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
            )}
          >
            <Shield className="size-4" aria-hidden />
            Admin
          </Link>
        )}
      </nav>
      <div className="mt-auto p-3 rounded-lg bg-muted text-xs">
        <div className="font-medium truncate" title={email}>
          {displayName}
        </div>
        <div className="text-muted-foreground">{tier === "pro" ? "Pro plan" : "Free plan"}</div>
        {tier === "free" && (
          <Link
            href="/settings/billing"
            className="mt-2 inline-block w-full text-center bg-primary text-primary-foreground rounded py-1.5 text-xs font-medium"
          >
            Upgrade to Pro
          </Link>
        )}
      </div>
    </aside>
  );
}
