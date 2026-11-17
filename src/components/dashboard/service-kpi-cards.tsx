"use client";

import { StatTile } from "@/components/ui/stat-tile";
import { formatCurrency } from "@/lib/utils";
import type { ServiceKPIs } from "@/lib/queries/dashboard";

export function ServiceKPICards({ data }: { data: ServiceKPIs }) {
  const kpis = [
    { label: "Service revenue", value: formatCurrency(data.serviceRevenue) },
    {
      label: "Service profit",
      value: formatCurrency(data.serviceProfit),
      definition: "Service revenue minus the cost of parts used on service jobs.",
    },
    { label: "Parts cost", value: formatCurrency(data.servicePartsCost) },
    { label: "Completed jobs", value: data.completedServiceJobs.toLocaleString("en-IE") },
    { label: "Active jobs", value: data.activeServiceJobs.toLocaleString("en-IE") },
    {
      label: "Avg turnaround",
      value: `${Math.round(data.avgTurnaroundDays)} days`,
      definition: "Average days from receiving a watch to completing the job.",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {kpis.map((kpi) => (
        <StatTile key={kpi.label} {...kpi} />
      ))}
    </div>
  );
}
