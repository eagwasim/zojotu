"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { ProfitChart } from "@/components/dashboard/profit-chart";
import { InventoryStatusChart } from "@/components/dashboard/inventory-status-chart";
import { SalesVelocityCards } from "@/components/dashboard/sales-velocity-cards";
import { TimeToSellChart } from "@/components/dashboard/time-to-sell-chart";
import { StagnatingInventory } from "@/components/dashboard/stagnating-inventory";
import { BrandProfitChart } from "@/components/dashboard/brand-profit-chart";
import { BrandDistributionChart } from "@/components/dashboard/brand-distribution-chart";
import { PlatformChart } from "@/components/dashboard/platform-chart";
import { MarginInsights } from "@/components/dashboard/margin-insights";
import { ServiceKPICards } from "@/components/dashboard/service-kpi-cards";
import { formatCurrency } from "@/lib/utils";
import type { DashboardKPIs } from "@/lib/queries/dashboard";

type PresetKey = "7d" | "30d" | "1m" | "1y" | "all" | "custom";

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "all", label: "All time" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "1m", label: "Last month" },
  { key: "1y", label: "Last year" },
  { key: "custom", label: "Custom range" },
];

function getPresetDates(key: PresetKey): { from: string; to: string } | null {
  if (key === "all" || key === "custom") return null;
  const to = new Date();
  const from = new Date();
  switch (key) {
    case "7d":
      from.setDate(from.getDate() - 7);
      break;
    case "30d":
      from.setDate(from.getDate() - 30);
      break;
    case "1m":
      from.setMonth(from.getMonth() - 1);
      break;
    case "1y":
      from.setFullYear(from.getFullYear() - 1);
      break;
  }
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePreset, setActivePreset] = useState<PresetKey>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const fetchDashboard = useCallback((from?: string, to?: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString();
    fetch(`/api/dashboard${qs ? `?${qs}` : ""}`)
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handlePresetChange = (key: PresetKey) => {
    setActivePreset(key);
    if (key === "custom") return;
    const dates = getPresetDates(key);
    if (dates) {
      setFromDate(dates.from);
      setToDate(dates.to);
      fetchDashboard(dates.from, dates.to);
    } else {
      setFromDate("");
      setToDate("");
      fetchDashboard();
    }
  };

  const handleCustomDate = (from: string, to: string) => {
    setFromDate(from);
    setToDate(to);
    if (from || to) {
      fetchDashboard(from, to);
    } else {
      fetchDashboard();
    }
  };

  if (loading && !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your watch business at a glance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <select
              value={activePreset}
              onChange={(e) => handlePresetChange(e.target.value as PresetKey)}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {PRESETS.map((preset) => (
                <option key={preset.key} value={preset.key}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>
          {activePreset === "custom" && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => handleCustomDate(e.target.value, toDate)}
                className="rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground [color-scheme:dark] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <label className="text-sm text-muted-foreground">To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => handleCustomDate(fromDate, e.target.value)}
                className="rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground [color-scheme:dark] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Combined Totals</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground">Combined Revenue</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{formatCurrency(data.combinedRevenue)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Watch sales + Service income</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground">Combined Profit</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{formatCurrency(data.combinedProfit)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Net profit + Service profit</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Sales Revenue</h2>
        <KPICards data={data} />

        <div className="grid grid-cols-1 gap-6">
          <ProfitChart data={data.monthlyProfits} />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Service Revenue</h2>
        <ServiceKPICards data={data.serviceKPIs} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Sales Velocity</h2>
        <SalesVelocityCards data={data.salesVelocity} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TimeToSellChart data={data.salesVelocity.timeToSellDistribution} />
          <StagnatingInventory data={data.salesVelocity.stagnatingInventory} />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Brand & Platform Analysis</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <BrandProfitChart data={data.brandAnalytics.mostProfitableBrands} />
          <PlatformChart data={data.platformPerformance} />
        </div>
        <MarginInsights data={data.platformPerformance} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <BrandDistributionChart data={data.brandAnalytics.brandInventoryDistribution} />
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Inventory Status</h2>
            <InventoryStatusChart data={data.watchesByStatus} />
          </div>
        </div>
      </div>
        </>
      )}
    </motion.div>
  );
}
