"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TimeDistribution {
  under7: number;
  days7to30: number;
  days30to90: number;
  over90: number;
}

export function TimeToSellChart({ data }: { data: TimeDistribution }) {
  const chartData = [
    { bucket: "< 7 days", count: data.under7 },
    { bucket: "7–30 days", count: data.days7to30 },
    { bucket: "30–90 days", count: data.days30to90 },
    { bucket: "90+ days", count: data.over90 },
  ];

  const total = data.under7 + data.days7to30 + data.days30to90 + data.over90;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Time to Sell Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
            No sales data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.01 260)" />
              <XAxis
                dataKey="bucket"
                stroke="oklch(0.6 0.01 260)"
                fontSize={12}
              />
              <YAxis stroke="oklch(0.6 0.01 260)" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.14 0.01 260)",
                  border: "1px solid oklch(0.25 0.01 260)",
                  borderRadius: "8px",
                  color: "oklch(0.95 0.01 260)",
                }}
              />
              <Bar
                dataKey="count"
                fill="oklch(0.65 0.15 250)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
