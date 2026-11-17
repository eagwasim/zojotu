"use client";

import { StatTile } from "@/components/ui/stat-tile";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import type { Dashboard } from "@/lib/dashboard/compute";

/** Relative change; null when there is no base to compare against. */
export function relChange(cur: number, prev: number | null | undefined) {
  if (prev === null || prev === undefined || prev === 0) return null;
  return (cur - prev) / Math.abs(prev);
}

interface HeroStatsProps {
  data: Dashboard;
  comparison?: string;
}

/** "How am I doing?": four numbers, each against the previous period, with a 12-month trend. */
export function HeroStats({ data, comparison }: HeroStatsProps) {
  const { current: c, previous: p, trend } = data.reselling;
  const hasPrev = !!p;
  const noBase = hasPrev ? "Nothing to compare with last period" : undefined;
  const marginDelta = p && c.margin !== null && p.margin !== null ? c.margin - p.margin : null;

  return (
    <section aria-label="Headline numbers" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile
        label="Net profit"
        value={formatCurrency(c.netProfit)}
        delta={relChange(c.netProfit, p?.netProfit)}
        deltaFallback={noBase}
        comparisonLabel={comparison}
        trend={trend.map((m) => m.netProfit)}
        definition="Sale price minus platform fees, shipping, purchase cost and parts, minus operating expenses and written-off watches. Watch sales only."
      />
      <StatTile
        label="Revenue"
        value={formatCurrency(c.revenue)}
        delta={relChange(c.revenue, p?.revenue)}
        deltaFallback={noBase}
        comparisonLabel={comparison}
        trend={trend.map((m) => m.revenue)}
        definition="Total sale price of watches sold, before fees."
      />
      <StatTile
        label="Margin"
        value={c.margin === null ? "—" : formatPercentage(c.margin)}
        delta={marginDelta}
        deltaUnit="points"
        deltaFallback={hasPrev ? "No sales to compare with" : undefined}
        comparisonLabel={comparison}
        trend={trend.map((m) => (m.revenue > 0 ? m.grossProfit / m.revenue : 0))}
        definition="Profit after fees, shipping, purchase cost and parts, as a share of revenue. Before operating expenses."
      />
      <StatTile
        label="Watches sold"
        value={c.watchesSold.toLocaleString("en-IE")}
        delta={relChange(c.watchesSold, p?.watchesSold)}
        deltaFallback={noBase}
        comparisonLabel={comparison}
        trend={trend.map((m) => m.sold)}
      />
    </section>
  );
}
