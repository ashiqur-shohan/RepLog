"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const LINKS = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/exercises", label: "Exercises", exact: false },
  { href: "/admin/muscle-groups", label: "Muscle Groups", exact: false },
  { href: "/admin/equipment", label: "Equipment", exact: false },
  { href: "/admin/users", label: "Users", exact: false },
];

export function AdminNav() {
  const pathname = usePathname() ?? "";
  return (
    <nav
      className="flex flex-wrap gap-1 border-b border-border pb-3"
      aria-label="Admin navigation"
    >
      {LINKS.map(({ href, label, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm transition-colors",
              active
                ? "bg-muted text-foreground font-medium"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
