"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { axisProps, chrome, formatAxisEuro, formatMonthLabel, gridProps, series } from "@/lib/chart-theme";
import { ChartEmpty, ChartLegend, ChartTooltip } from "./chart-tooltip";

interface MonthlyProfit {
  month: string;
  revenue: number;
  cogs: number;
  profit: number;
}

const REVENUE = series[0];
const PROFIT = series[2];

export function ProfitChart({ data }: { data: MonthlyProfit[] }) {
  return (
    <Card>
      <CardHeader className="sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle>Revenue and profit by month</CardTitle>
          <CardDescription>Watch sales only. Profit is sale price minus fees, shipping, purchase cost and parts.</CardDescription>
        </div>
        {data.length > 0 && (
          <ChartLegend
            items={[
              { label: "Revenue", color: REVENUE },
              { label: "Profit", color: PROFIT },
            ]}
          />
        )}
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <ChartEmpty height={320}>Record your first sale to see monthly revenue and profit.</ChartEmpty>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="month" {...axisProps} tickFormatter={formatMonthLabel} minTickGap={16} />
              <YAxis {...axisProps} axisLine={false} tickFormatter={formatAxisEuro} width={64} />
              <Tooltip
                cursor={{ stroke: chrome.axis, strokeWidth: 1 }}
                content={(props) => (
                  <ChartTooltip
                    {...(props as object)}
                    formatLabel={formatMonthLabel}
                    formatValue={(v) => formatCurrency(v)}
                  />
                )}
              />
              <Area isAnimationActive={false}
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke={REVENUE}
                fill={REVENUE}
                fillOpacity={0.08}
                strokeWidth={2}
                activeDot={{ r: 4, stroke: chrome.surface, strokeWidth: 2 }}
              />
              <Area isAnimationActive={false}
                type="monotone"
                dataKey="profit"
                name="Profit"
                stroke={PROFIT}
                fill={PROFIT}
                fillOpacity={0.1}
                strokeWidth={2}
                activeDot={{ r: 4, stroke: chrome.surface, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
