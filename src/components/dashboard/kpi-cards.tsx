"use client";

import { StatTile } from "@/components/ui/stat-tile";
import { formatCurrency, formatPercentage } from "@/lib/utils";

interface KPIData {
  grossRevenue: number;
  grossProfit: number;
  netProfit: number;
  marginPercent: number;
  roiPercent: number;
  watchesSold: number;
  avgDaysToSell: number;
  activeInventoryValue: number;
  totalOpEx: number;
  totalWatches: number;
}

export function KPICards({ data }: { data: KPIData }) {
  const kpis = [
    {
      label: "Revenue",
      value: formatCurrency(data.grossRevenue),
      definition: "Total sale price of watches sold in the period, before fees.",
    },
    {
      label: "Net profit",
      value: formatCurrency(data.netProfit),
      definition:
        "Sale price minus platform fees, shipping, purchase cost and parts, minus operating expenses.",
    },
    {
      label: "Margin",
      value: formatPercentage(data.marginPercent),
      definition: "Profit (after fees, shipping, purchase cost and parts) as a share of revenue.",
    },
    {
      label: "Return on cost",
      value: formatPercentage(data.roiPercent),
      definition: "Profit (after fees and shipping) divided by what the sold watches cost you: purchase plus parts.",
    },
    {
      label: "Watches sold",
      value: data.watchesSold.toLocaleString("en-IE"),
    },
    {
      label: "Avg days to sell",
      value: `${Math.round(data.avgDaysToSell)} days`,
      definition: "Average days from acquisition date to sale date.",
    },
    {
      label: "Stock at cost",
      value: formatCurrency(data.activeInventoryValue),
      definition: "Purchase cost plus parts for every watch not yet sold. This is cash tied up in stock.",
    },
    {
      label: "Operating expenses",
      value: formatCurrency(data.totalOpEx),
      definition: "Business costs not tied to a single watch: tools, supplies, software, shipping, marketing.",
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
