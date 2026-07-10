"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Wrench, TrendingUp, Clock, CheckCircle2, Activity } from "lucide-react";
import type { ServiceKPIs } from "@/lib/queries/dashboard";

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

export function ServiceKPICards({ data }: { data: ServiceKPIs }) {
  const kpis = [
    {
      label: "Service Revenue",
      value: formatCurrency(data.serviceRevenue),
      icon: Wrench,
    },
    {
      label: "Service Profit",
      value: formatCurrency(data.serviceProfit),
      icon: TrendingUp,
    },
    {
      label: "Parts Cost",
      value: formatCurrency(data.servicePartsCost),
      icon: Activity,
    },
    {
      label: "Completed Jobs",
      value: data.completedServiceJobs.toString(),
      icon: CheckCircle2,
    },
    {
      label: "Active Jobs",
      value: data.activeServiceJobs.toString(),
      icon: Clock,
    },
    {
      label: "Avg Turnaround",
      value: `${Math.round(data.avgTurnaroundDays)} days`,
      icon: Clock,
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
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
