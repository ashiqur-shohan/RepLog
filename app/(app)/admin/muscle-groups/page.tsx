import { requireAdmin } from "@/lib/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Admin · Muscle Groups — replog" };

type MuscleGroupRow = {
  id: string;
  slug: string;
  name: string;
  display_order: number;
};

export default async function AdminMuscleGroupsPage() {
  await requireAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const { data: muscleGroups, error } = await admin
    .from("muscle_groups")
    .select("id, slug, name, display_order")
    .order("display_order") as { data: MuscleGroupRow[] | null; error: { message: string } | null };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Muscle Groups</h1>
        <span className="text-sm text-muted-foreground">Read-only in v1</span>
      </div>

      {error && (
        <p className="text-sm text-destructive">Failed to load muscle groups: {error.message}</p>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">
            {muscleGroups?.length ?? 0} groups
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {muscleGroups?.map((mg) => (
              <div key={mg.id} className="flex items-center justify-between px-6 py-3 text-sm">
                <div>
                  <span className="font-medium">{mg.name}</span>
                  <span className="ml-2 font-mono text-xs text-muted-foreground">{mg.slug}</span>
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  order: {mg.display_order}
                </span>
              </div>
            ))}
            {(muscleGroups?.length ?? 0) === 0 && (
              <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                No muscle groups found. Run the seed script.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
