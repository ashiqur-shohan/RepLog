"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ChartDataPoint } from "./ProgressTabs";

interface AreaChartInnerProps {
  data: ChartDataPoint[];
}

export default function AreaChartInner({ data }: AreaChartInnerProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
        <defs>
          <linearGradient id="lime-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8FF5C" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#E8FF5C" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            fontSize: "12px",
            fontFamily: "var(--font-mono)",
            color: "var(--foreground)",
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#E8FF5C"
          strokeWidth={2}
          fill="url(#lime-gradient)"
          dot={false}
          activeDot={{ r: 4, fill: "#E8FF5C", stroke: "var(--background)" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
