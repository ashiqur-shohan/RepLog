import { PageHeader } from "@/components/shared/PageHeader";
import { ProgressTabs } from "@/components/domain/progress/ProgressTabs";
import { requireUser } from "@/lib/guards";
import { listMeasurements } from "@/lib/actions/measurements";

export const metadata = { title: "Progress" };

export default async function ProgressPage() {
  // requireUser ensures the user is authenticated
  await requireUser();

  const bodyweightMeasurements = await listMeasurements("bodyweight", "12W").catch(() => []);

  return (
    <div className="max-w-2xl mx-auto px-5 pt-6 pb-12">
      <PageHeader title="Progress" />
      <ProgressTabs initialBodyweightMeasurements={bodyweightMeasurements} />
    </div>
  );
}
