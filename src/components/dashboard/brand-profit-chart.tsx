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
import { formatCurrency } from "@/lib/utils";

interface BrandProfit {
  brand: string;
  totalProfit: number;
  unitsSold: number;
  avgProfit: number;
}

export function BrandProfitChart({ data }: { data: BrandProfit[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Most Profitable Brands
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
            No sales data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.01 260)" />
              <XAxis type="number" stroke="oklch(0.6 0.01 260)" fontSize={12} />
              <YAxis
                type="category"
                dataKey="brand"
                stroke="oklch(0.6 0.01 260)"
                fontSize={12}
                width={90}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.14 0.01 260)",
                  border: "1px solid oklch(0.25 0.01 260)",
                  borderRadius: "8px",
                  color: "oklch(0.95 0.01 260)",
                }}
                formatter={(value: any, name: any) => {
                  if (name === "totalProfit") return [formatCurrency(Number(value)), "Total Profit"];
                  if (name === "avgProfit") return [formatCurrency(Number(value)), "Avg Profit"];
                  return [value, name];
                }}
              />
              <Bar
                dataKey="totalProfit"
                fill="oklch(0.65 0.12 160)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
