"use client";

import { useEffect, useState, useCallback } from "react";
import { Calendar } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { controlClasses } from "@/components/ui/field";
import { cn } from "@/lib/utils";
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
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Your watch business at a glance"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar aria-hidden className="size-4 text-muted-foreground" />
              <select
                aria-label="Date range"
                value={activePreset}
                onChange={(e) => handlePresetChange(e.target.value as PresetKey)}
                className={cn(controlClasses, "h-9 w-auto")}
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
                <label htmlFor="dashboard-from" className="text-sm text-muted-foreground">From</label>
                <input
                  id="dashboard-from"
                  type="date"
                  value={fromDate}
                  onChange={(e) => handleCustomDate(e.target.value, toDate)}
                  className={cn(controlClasses, "h-9 w-auto")}
                />
                <label htmlFor="dashboard-to" className="text-sm text-muted-foreground">To</label>
                <input
                  id="dashboard-to"
                  type="date"
                  value={toDate}
                  onChange={(e) => handleCustomDate(fromDate, e.target.value)}
                  className={cn(controlClasses, "h-9 w-auto")}
                />
              </div>
            )}
          </div>
        }
      />

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Combined totals</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-card p-4 shadow-card">
            <p className="text-xs font-medium text-muted-foreground">Combined revenue</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{formatCurrency(data.combinedRevenue)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Watch sales + service income</p>
          </div>
          <div className="rounded-xl bg-card p-4 shadow-card">
            <p className="text-xs font-medium text-muted-foreground">Combined profit</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{formatCurrency(data.combinedProfit)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Net profit + service profit</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Sales revenue</h2>
        <KPICards data={data} />

        <div className="grid grid-cols-1 gap-6">
          <ProfitChart data={data.monthlyProfits} />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Service revenue</h2>
        <ServiceKPICards data={data.serviceKPIs} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Sales velocity</h2>
        <SalesVelocityCards data={data.salesVelocity} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TimeToSellChart data={data.salesVelocity.timeToSellDistribution} />
          <StagnatingInventory data={data.salesVelocity.stagnatingInventory} />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Brand & platform analysis</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <BrandProfitChart data={data.brandAnalytics.mostProfitableBrands} />
          <PlatformChart data={data.platformPerformance} />
        </div>
        <MarginInsights data={data.platformPerformance} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <BrandDistributionChart data={data.brandAnalytics.brandInventoryDistribution} />
          <InventoryStatusChart data={data.watchesByStatus} />
        </div>
      </div>
        </>
      )}
    </div>
  );
}
