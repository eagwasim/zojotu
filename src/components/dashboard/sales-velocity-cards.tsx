"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { formatPercentage } from "@/lib/utils";
import { Target, Calendar, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { SalesVelocity } from "@/lib/queries/dashboard";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function formatMonth(month: string) {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1);
  return date.toLocaleDateString("en-IE", { month: "short", year: "2-digit" });
}

export function SalesVelocityCards({ data }: { data: SalesVelocity }) {
  const TrendIcon =
    data.salesTrend === "up"
      ? TrendingUp
      : data.salesTrend === "down"
        ? TrendingDown
        : Minus;

  const trendColor =
    data.salesTrend === "up"
      ? "text-green-500"
      : data.salesTrend === "down"
        ? "text-red-500"
        : "text-muted-foreground";

  const kpis = [
    {
      label: "Sell-Through Rate",
      value: formatPercentage(data.sellThroughRate),
      icon: Target,
    },
    {
      label: "Best Month",
      value: data.bestMonth ? formatMonth(data.bestMonth.month) : "—",
      icon: Calendar,
    },
    {
      label: "Worst Month",
      value: data.worstMonth ? formatMonth(data.worstMonth.month) : "—",
      icon: Calendar,
    },
    {
      label: "Sales Trend",
      value: data.salesTrend.charAt(0).toUpperCase() + data.salesTrend.slice(1),
      icon: TrendIcon,
      iconColor: trendColor,
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {kpis.map((kpi) => (
        <motion.div key={kpi.label} variants={item}>
          <Card className="relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {kpi.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {kpi.value}
                </p>
              </div>
              <div className="rounded-lg bg-primary/10 p-2.5">
                <kpi.icon
                  className={`h-5 w-5 ${kpi.iconColor || "text-primary"}`}
                />
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
