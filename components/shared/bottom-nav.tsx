"use client";

import { History, Home, LineChart, ListChecks, Plus, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/library", label: "Library", icon: ListChecks },
  { href: "/progress", label: "Progress", icon: LineChart },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav({ showAdmin }: { showAdmin: boolean }) {
  const pathname = usePathname() ?? "";
  // Hide on workout focus mode (active logger)
  if (pathname.startsWith("/workout/")) return null;
  return (
    <nav
      aria-label="Bottom"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background safe-bottom"
    >
      <div className="grid grid-cols-5 items-end px-3 pt-2 pb-2">
        {TABS.slice(0, 2).map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-1.5 text-[10px]",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </Link>
          );
        })}
        <Link
          href="/workout/new"
          aria-label="Start a workout"
          className="-mt-6 mx-auto w-14 h-14 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-glow-primary"
        >
          <Plus className="size-6" aria-hidden />
        </Link>
        {TABS.slice(2).map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-1.5 text-[10px]",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </Link>
          );
        })}
      </div>
      {showAdmin && null /* admin appears in sidebar; not on bottom-nav by design */}
    </nav>
  );
}
