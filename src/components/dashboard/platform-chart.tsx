"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { axisProps, chrome, formatAxisEuro, gridProps, series } from "@/lib/chart-theme";
import type { PlatformPerformance } from "@/lib/queries/dashboard";
import { ChartEmpty, ChartLegend, ChartTooltip } from "./chart-tooltip";

const SERIES = [
  { key: "revenue", label: "Revenue", color: series[0] },
  { key: "profit", label: "Profit", color: series[2] },
  { key: "fees", label: "Fees", color: series[1] },
] as const;

/*
 * One money axis only. Margin % used to sit on a second y-axis, which invents a
 * relationship between two unrelated scales; it now lives in the tooltip and the badge.
 * (Phase 3 replaces this with ranked profit bars + a margin dot plot.)
 */
export function PlatformChart({ data }: { data: PlatformPerformance }) {
  return (
    <Card>
      <CardHeader className="sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle>Platform performance</CardTitle>
          <CardDescription>Revenue, profit and fees per sales platform.</CardDescription>
        </div>
        {data.bestPlatformByMargin && (
          <Badge tone="good">
            Best margin: {data.bestPlatformByMargin.platform} ({formatPercentage(data.bestPlatformByMargin.margin)})
          </Badge>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {data.revenueByPlatform.length === 0 ? (
          <ChartEmpty height={280}>Record a sale to compare platforms.</ChartEmpty>
        ) : (
          <>
            <ChartLegend items={SERIES.map((s) => ({ label: s.label, color: s.color }))} />
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.revenueByPlatform} barGap={2} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="platform" {...axisProps} interval={0} />
                <YAxis {...axisProps} axisLine={false} tickFormatter={formatAxisEuro} width={64} />
                <Tooltip
                  cursor={{ fill: chrome.grid, fillOpacity: 0.4 }}
                  content={(props) => (
                    <ChartTooltip
                      {...(props as object)}
                      formatValue={(v, row) => {
                        if (row.dataKey === "fees") {
                          const rev = Number(row.payload?.revenue ?? 0);
                          return `${formatCurrency(v)} (${formatPercentage(rev > 0 ? v / rev : 0)})`;
                        }
                        return formatCurrency(v);
                      }}
                      footer={(d) => <>Margin {formatPercentage(Number(d.margin))}</>}
                    />
                  )}
                />
                {SERIES.map((s) => (
                  <Bar isAnimationActive={false} key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={24} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
}
