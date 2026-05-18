import { requireAdmin } from "@/lib/guards";
import { listAdminUsers } from "@/lib/actions/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";

export const metadata = { title: "Admin · Users — replog" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";

  const result = await listAdminUsers({ q: q || undefined });
  const users = result.ok ? result.data.users : [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Users</h1>

      {/* Search */}
      <form className="max-w-sm">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by email…"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </form>

      {!result.ok && (
        <p className="text-sm text-destructive">Error: {result.error}</p>
      )}

      {/* Desktop table */}
      <div className="hidden md:block rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Tier</th>
              <th className="px-4 py-3 text-left font-medium">Last sign in</th>
              <th className="px-4 py-3 text-left font-medium">ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No users found.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-medium">{u.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={u.tier === "pro" ? "default" : "secondary"}>
                    {u.tier}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {u.last_sign_in_at
                    ? format(parseISO(u.last_sign_in_at), "MMM d, yyyy HH:mm")
                    : "Never"}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground truncate max-w-[160px]">
                  {u.id}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {users.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No users found.</p>
        )}
        {users.map((u) => (
          <Card key={u.id}>
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm truncate">{u.email}</span>
                <Badge variant={u.tier === "pro" ? "default" : "secondary"} className="shrink-0">
                  {u.tier}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Last sign in:{" "}
                {u.last_sign_in_at
                  ? format(parseISO(u.last_sign_in_at), "MMM d, yyyy")
                  : "Never"}
              </div>
              <div className="font-mono text-[10px] text-muted-foreground truncate">{u.id}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
