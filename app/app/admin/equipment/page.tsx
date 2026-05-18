import { requireAdmin } from "@/lib/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Admin · Equipment — replog" };

type EquipmentRow = {
  id: string;
  slug: string;
  name: string;
  display_order: number;
};

export default async function AdminEquipmentPage() {
  await requireAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const { data: equipment, error } = await admin
    .from("equipment")
    .select("id, slug, name, display_order")
    .order("display_order") as { data: EquipmentRow[] | null; error: { message: string } | null };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Equipment</h1>
        <span className="text-sm text-muted-foreground">Read-only in v1</span>
      </div>

      {error && (
        <p className="text-sm text-destructive">Failed to load equipment: {error.message}</p>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">
            {equipment?.length ?? 0} items
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {equipment?.map((eq) => (
              <div key={eq.id} className="flex items-center justify-between px-6 py-3 text-sm">
                <div>
                  <span className="font-medium">{eq.name}</span>
                  <span className="ml-2 font-mono text-xs text-muted-foreground">{eq.slug}</span>
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  order: {eq.display_order}
                </span>
              </div>
            ))}
            {(equipment?.length ?? 0) === 0 && (
              <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                No equipment found. Run the seed script.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
