"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { MeasurementsCard } from "@/components/domain/progress/MeasurementsCard";
import { listMeasurements, type Measurement } from "@/lib/actions/measurements";

// Dynamic-import the entire recharts AreaChart bundle to keep the app-shell small.
// We import a wrapper component instead of individual named exports to avoid
// the "loader must return {default: ...}" constraint on dynamic().
const RechartsAreaChart = dynamic(
  () => import("@/components/domain/progress/AreaChartInner"),
  { ssr: false, loading: () => <Skeleton className="h-[120px] w-full" /> },
);

type TimeRange = "4W" | "12W" | "6M" | "1Y" | "All";
const TIME_RANGES: TimeRange[] = ["4W", "12W", "6M", "1Y", "All"];

export interface ChartDataPoint {
  date: string;
  value: number;
}

interface ChartCardProps {
  title: string;
  data: ChartDataPoint[];
  unit: string;
  isLoading: boolean;
}

function delta(data: ChartDataPoint[]): { pct: number } | null {
  if (data.length < 2) return null;
  const latest = data[data.length - 1]!.value;
  const avg = data.reduce((a, b) => a + b.value, 0) / data.length;
  return { pct: ((latest - avg) / avg) * 100 };
}

function ChartCard({ title, data, unit, isLoading }: ChartCardProps) {
  const latest = data.at(-1);
  const d = delta(data);

  return (
    <div className="p-4 rounded-lg bg-card border border-border">
      <div className="text-xs text-muted-foreground">{title}</div>
      {isLoading ? (
        <Skeleton className="h-8 w-32 mt-1" />
      ) : (
        <div className="font-mono text-3xl text-primary mt-1">
          {latest ? latest.value.toLocaleString() : "—"}{" "}
          <span className="text-base text-muted-foreground">{unit}</span>
        </div>
      )}
      {d && !isLoading && (
        <div className={`text-xs mt-0.5 ${d.pct >= 0 ? "text-success" : "text-destructive"}`}>
          {d.pct >= 0 ? "+" : ""}
          {d.pct.toFixed(1)}% vs avg
        </div>
      )}

      <div className="mt-4 h-[120px]">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : data.length < 2 ? (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
            Not enough data for this range.
          </div>
        ) : (
          <RechartsAreaChart data={data} />
        )}
      </div>
    </div>
  );
}

type BwRange = "4W" | "12W" | "6M" | "1Y" | "all";

function useBodyweightData(range: TimeRange) {
  const apiRange: BwRange = range === "All" ? "all" : (range as BwRange);
  return useQuery({
    queryKey: ["measurements", "bodyweight", range],
    queryFn: async () => {
      const data = await listMeasurements("bodyweight", apiRange);
      return data.map((m: Measurement) => ({
        date: new Date(m.measured_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        value: m.value,
      }));
    },
  });
}

interface ProgressTabsProps {
  initialBodyweightMeasurements: Measurement[];
}

export function ProgressTabs({ initialBodyweightMeasurements }: ProgressTabsProps) {
  const [range, setRange] = useState<TimeRange>("12W");
  const { data: bwData = [], isLoading: bwLoading } = useBodyweightData(range);

  return (
    <div className="mt-4">
      <Tabs defaultValue="volume">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="volume">Volume</TabsTrigger>
          <TabsTrigger value="1rm">1RM</TabsTrigger>
          <TabsTrigger value="frequency">Frequency</TabsTrigger>
          <TabsTrigger value="bodyweight">Bodyweight</TabsTrigger>
        </TabsList>

        {/* Time-range pills */}
        <div className="mt-3 flex gap-1.5 text-xs">
          {TIME_RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 rounded-full transition-colors ${
                range === r
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <TabsContent value="volume">
          <ChartCard title="Total weekly volume" data={[]} unit="kg" isLoading={false} />
        </TabsContent>

        <TabsContent value="1rm">
          <div className="p-4 rounded-lg bg-card border border-border">
            <div className="text-xs text-muted-foreground">Estimated 1RM</div>
            <p className="text-sm text-muted-foreground mt-4 text-center py-8">
              Log workouts to see your estimated 1RM progress.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="frequency">
          <div className="p-4 rounded-lg bg-card border border-border">
            <div className="text-xs text-muted-foreground">Workouts per week</div>
            <p className="text-sm text-muted-foreground mt-4 text-center py-8">
              Log more sessions to see frequency trends.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="bodyweight">
          <div className="space-y-4">
            <ChartCard
              title="Bodyweight trend"
              data={bwData}
              unit="kg"
              isLoading={bwLoading}
            />
            <MeasurementsCard
              metric="bodyweight"
              initialMeasurements={initialBodyweightMeasurements}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
