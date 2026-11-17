"use client";

import { StatTile } from "@/components/ui/stat-tile";
import { formatPercentage } from "@/lib/utils";
import { formatMonthLabel } from "@/lib/chart-theme";
import type { SalesVelocity } from "@/lib/queries/dashboard";

const trendLabel = { up: "Rising", down: "Falling", flat: "Flat" } as const;

export function SalesVelocityCards({ data }: { data: SalesVelocity }) {
  const kpis = [
    {
      label: "Sell-through rate",
      value: formatPercentage(data.sellThroughRate),
      definition: "Watches sold in this period as a share of every watch you have bought.",
    },
    {
      label: "Best month",
      value: data.bestMonth ? formatMonthLabel(data.bestMonth.month) : "—",
      definition: "Month with the highest profit from watch sales.",
    },
    {
      label: "Weakest month",
      value: data.worstMonth ? formatMonthLabel(data.worstMonth.month) : "—",
      definition: "Month with the lowest profit from watch sales.",
    },
    {
      label: "Sales trend",
      value: trendLabel[data.salesTrend],
      definition: "Revenue in the latest month with sales, compared with the month before.",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <StatTile key={kpi.label} {...kpi} />
      ))}
    </div>
  );
}
