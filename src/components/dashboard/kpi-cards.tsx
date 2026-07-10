"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import {
  DollarSign,
  TrendingUp,
  Package,
  Clock,
  ShoppingCart,
  Wallet,
} from "lucide-react";

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

export function KPICards({ data }: { data: KPIData }) {
  const kpis = [
    {
      label: "Gross Revenue",
      value: formatCurrency(data.grossRevenue),
      icon: DollarSign,
    },
    {
      label: "Net Profit",
      value: formatCurrency(data.netProfit),
      icon: TrendingUp,
    },
    {
      label: "Margin",
      value: formatPercentage(data.marginPercent),
      icon: TrendingUp,
    },
    {
      label: "ROI",
      value: formatPercentage(data.roiPercent),
      icon: TrendingUp,
    },
    {
      label: "Watches Sold",
      value: data.watchesSold.toString(),
      icon: ShoppingCart,
    },
    {
      label: "Avg Days to Sell",
      value: `${Math.round(data.avgDaysToSell)} days`,
      icon: Clock,
    },
    {
      label: "Inventory Value",
      value: formatCurrency(data.activeInventoryValue),
      icon: Package,
    },
    {
      label: "Operating Expenses",
      value: formatCurrency(data.totalOpEx),
      icon: Wallet,
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
                <kpi.icon className="h-5 w-5 text-primary" />
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
