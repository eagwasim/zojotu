"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import type { PlatformPerformance } from "@/lib/queries/dashboard";

export function PlatformChart({ data }: { data: PlatformPerformance }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Platform Performance
          </CardTitle>
          {data.bestPlatformByMargin && (
            <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-500">
              Best margin: {data.bestPlatformByMargin.platform} ({formatPercentage(data.bestPlatformByMargin.margin)})
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {data.revenueByPlatform.length === 0 ? (
          <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
            No sales data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.revenueByPlatform}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.01 260)" />
              <XAxis
                dataKey="platform"
                stroke="oklch(0.6 0.01 260)"
                fontSize={12}
              />
              <YAxis stroke="oklch(0.6 0.01 260)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.14 0.01 260)",
                  border: "1px solid oklch(0.25 0.01 260)",
                  borderRadius: "8px",
                  color: "oklch(0.95 0.01 260)",
                }}
                formatter={(value: any, name: any) => {
                  return [formatCurrency(Number(value)), String(name).charAt(0).toUpperCase() + String(name).slice(1)];
                }}
              />
              <Legend
                wrapperStyle={{ color: "oklch(0.6 0.01 260)", fontSize: 12 }}
              />
              <Bar
                dataKey="revenue"
                fill="oklch(0.75 0.15 85)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="profit"
                fill="oklch(0.65 0.12 160)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="fees"
                fill="oklch(0.6 0.1 25)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
