"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { axisProps, chrome, formatAxisEuro, series } from "@/lib/chart-theme";
import { ChartEmpty, ChartTooltip } from "./chart-tooltip";

interface BrandProfit {
  brand: string;
  totalProfit: number;
  unitsSold: number;
  avgProfit: number;
}

export function BrandProfitChart({ data }: { data: BrandProfit[] }) {
  const rows = [...data].sort((a, b) => b.totalProfit - a.totalProfit).slice(0, 8);
  const height = Math.max(160, rows.length * 36 + 24);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Most profitable brands</CardTitle>
        <CardDescription>Profit from watches sold, after fees and shipping. Top 8.</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <ChartEmpty height={200}>Brands appear here once you have sold a watch.</ChartEmpty>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 64, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={chrome.grid} horizontal={false} />
              <XAxis type="number" {...axisProps} axisLine={false} tickFormatter={formatAxisEuro} hide />
              <YAxis type="category" dataKey="brand" {...axisProps} axisLine={false} width={96} />
              <Tooltip
                cursor={{ fill: chrome.grid, fillOpacity: 0.4 }}
                content={(props) => (
                  <ChartTooltip
                    {...(props as object)}
                    formatValue={(v) => formatCurrency(v)}
                    footer={(d) => (
                      <>
                        {String(d.unitsSold)} sold · {formatCurrency(Number(d.avgProfit))} avg
                      </>
                    )}
                  />
                )}
              />
              <Bar isAnimationActive={false} dataKey="totalProfit" name="Profit" fill={series[0]} radius={[0, 4, 4, 0]} maxBarSize={24}>
                <LabelList
                  dataKey="totalProfit"
                  position="right"
                  formatter={(v: unknown) => formatAxisEuro(Number(v))}
                  style={{ fill: chrome.ink, fontSize: 12 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
