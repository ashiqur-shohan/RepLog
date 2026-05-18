import type { ReactNode } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/guards";
import { AdminNav } from "./AdminNav";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/app/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← App
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium">Admin</span>
      </div>
      <AdminNav />
      <div className="mt-6">{children}</div>
    </div>
  );
}
