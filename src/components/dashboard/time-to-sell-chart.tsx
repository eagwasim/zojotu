"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import { axisProps, chrome, gridProps, ordinalBlue } from "@/lib/chart-theme";
import { ChartEmpty, ChartTooltip } from "./chart-tooltip";

interface TimeDistribution {
  under7: number;
  days7to30: number;
  days30to90: number;
  over90: number;
}

export function TimeToSellChart({ data }: { data: TimeDistribution }) {
  // Ordered buckets: a single-hue ramp, slower = darker.
  const chartData = [
    { bucket: "Under 7 days", count: data.under7, color: ordinalBlue[0] },
    { bucket: "7–30 days", count: data.days7to30, color: ordinalBlue[1] },
    { bucket: "30–90 days", count: data.days30to90, color: ordinalBlue[2] },
    { bucket: "90+ days", count: data.over90, color: ordinalBlue[3] },
  ];
  const total = chartData.reduce((s, d) => s + d.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time to sell</CardTitle>
        <CardDescription>Days from acquisition to sale, for watches sold.</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <ChartEmpty height={240}>Sell a watch to see how long stock takes to move.</ChartEmpty>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="bucket" {...axisProps} interval={0} />
              <YAxis {...axisProps} axisLine={false} allowDecimals={false} width={32} />
              <Tooltip
                cursor={{ fill: chrome.grid, fillOpacity: 0.4 }}
                content={(props) => (
                  <ChartTooltip
                    {...(props as object)}
                    formatValue={(v) => `${v} watch${v === 1 ? "" : "es"} (${Math.round((v / total) * 100)}%)`}
                  />
                )}
              />
              <Bar isAnimationActive={false} dataKey="count" name="Sold" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {chartData.map((d) => (
                  <Cell key={d.bucket} fill={d.color} />
                ))}
                <LabelList dataKey="count" position="top" style={{ fill: chrome.ink, fontSize: 12 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
