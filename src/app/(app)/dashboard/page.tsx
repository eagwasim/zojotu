"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs } from "@base-ui/react/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { SegmentedFilter } from "@/components/ui/filter-bar";
import { DateInput } from "@/components/ui/date-input";
import { HeroStats } from "@/components/dashboard/hero-stats";
import { AttentionList } from "@/components/dashboard/attention-list";
import { StockPanel } from "@/components/dashboard/stock-panel";
import { ProfitChart } from "@/components/dashboard/profit-chart";
import { PlatformTable } from "@/components/dashboard/platform-table";
import { BrandProfitChart } from "@/components/dashboard/brand-profit-chart";
import { TimeToSellChart } from "@/components/dashboard/time-to-sell-chart";
import { ServicePanel } from "@/components/dashboard/service-panel";
import { cn, formatCurrency, formatPercentage } from "@/lib/utils";
import {
  DEFAULT_PERIOD,
  PERIODS,
  comparisonLabel,
  rangeFor,
  type PeriodKey,
} from "@/lib/dashboard/periods";
import type { Dashboard } from "@/lib/dashboard/compute";

const fmtDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" });

const tabClass =
  "relative h-9 px-1 text-sm text-muted-foreground outline-none transition-colors duration-150 hover:text-foreground data-active:font-medium data-active:text-foreground focus-visible:outline-2 focus-visible:outline-ring";

function DashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const period = (params.get("period") as PeriodKey) || DEFAULT_PERIOD;
  const customFrom = params.get("from");
  const customTo = params.get("to");
  const tab = params.get("tab") === "service" ? "service" : "reselling";

  const range = useMemo(
    () => rangeFor(period, new Date(), { from: customFrom, to: customTo }),
    [period, customFrom, customTo]
  );
  const rangeKey = range ? `${range.from}:${range.to}` : "all";

  const [data, setData] = useState<Dashboard | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loading = loadedKey !== rangeKey;

  useEffect(() => {
    const ctrl = new AbortController();
    const qs = range ? `?from=${range.from}&to=${range.to}` : "";
    fetch(`/api/dashboard${qs}`, { signal: ctrl.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Couldn't load the dashboard");
        return r.json();
      })
      .then((d: Dashboard) => {
        setData(d);
        setError(null);
        setLoadedKey(rangeKey);
      })
      .catch((e) => {
        if (ctrl.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Couldn't load the dashboard");
        setLoadedKey(rangeKey);
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeKey]);

  const setParams = (next: Record<string, string | null>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === null) sp.delete(k);
      else sp.set(k, v);
    }
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  };

  const comparison = comparisonLabel(range);
  const rangeText = range ? `${fmtDate(range.from)} – ${fmtDate(range.to)}` : "All time";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={range ? `${rangeText}, compared with the ${comparison?.replace("vs ", "")}.` : "All time."}
      />

      {/* One row of filters above everything they scope. */}
      <div className="flex flex-wrap items-end gap-3">
        <SegmentedFilter
          label="Period"
          value={period}
          onChange={(v) => setParams({ period: v, from: null, to: null })}
          options={[...PERIODS.map((p) => ({ value: p.key, label: p.label })), { value: "custom", label: "Custom" }]}
        />
        {period === "custom" && (
          <div className="flex items-end gap-2">
            <DateInput
              label="From"
              quickPicks={false}
              value={customFrom ?? ""}
              onValueChange={(v) => setParams({ from: v || null })}
              className="h-8 w-40"
            />
            <DateInput
              label="To"
              quickPicks={false}
              value={customTo ?? ""}
              onValueChange={(v) => setParams({ to: v || null })}
              className="h-8 w-40"
            />
          </div>
        )}
      </div>

      {error && !data && (
        <p role="alert" className="rounded-lg bg-critical-wash px-4 py-3 text-sm text-critical-ink">
          {error}
        </p>
      )}

      {!data ? (
        !error && <DashboardSkeleton />
      ) : (
        <Tabs.Root value={tab} onValueChange={(v) => setParams({ tab: v === "service" ? "service" : null })}>
          <Tabs.List className="relative mb-6 flex gap-6 border-b border-border">
            <Tabs.Tab value="reselling" className={tabClass}>
              Reselling
            </Tabs.Tab>
            <Tabs.Tab value="service" className={tabClass}>
              Service
              {data.service.pending > 0 && (
                <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-warning-wash px-1.5 text-[11px] font-semibold tabular-nums text-warning-ink">
                  {data.service.pending}
                  <span className="sr-only"> waiting</span>
                </span>
              )}
            </Tabs.Tab>
            <Tabs.Indicator className="absolute bottom-[-1px] left-0 h-0.5 w-(--active-tab-width) translate-x-(--active-tab-left) bg-foreground transition-[translate,width] duration-200 ease-out" />
          </Tabs.List>

          {/* Refetch keeps the frame: old numbers stay, dimmed, until the new ones arrive. */}
          <div
            aria-busy={loading}
            className={cn("transition-opacity duration-150", loading && "pointer-events-none opacity-55")}
          >
            <Tabs.Panel value="reselling" className="flex flex-col gap-6 outline-none">
              <HeroStats data={data} comparison={comparison} />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                <StockPanel stock={data.stock} className="lg:col-span-3" />
                <AttentionList items={data.actions} className="lg:col-span-2" />
              </div>

              <ProfitChart data={data.reselling.monthly} />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                <PlatformTable rows={data.reselling.platforms} className="lg:col-span-3" />
                <div className="lg:col-span-2">
                  <TimeToSellChart data={data.reselling.timeToSell} />
                </div>
              </div>

              <BrandProfitChart data={data.reselling.brands} />

              <MoreMetrics data={data} />
            </Tabs.Panel>

            <Tabs.Panel value="service" className="outline-none">
              <ServicePanel data={data} comparison={comparison} />
            </Tabs.Panel>
          </div>
        </Tabs.Root>
      )}
    </div>
  );
}

/** Secondary numbers, one click away instead of competing with the headline. */
function MoreMetrics({ data }: { data: Dashboard }) {
  const c = data.reselling.current;
  const rows: [string, string, string][] = [
    ["Return on cost", c.roi === null ? "—" : formatPercentage(c.roi), "Profit after fees ÷ purchase cost and parts of the watches sold."],
    ["Average days to sell", c.avgDaysToSell === null ? "—" : `${Math.round(c.avgDaysToSell)} days`, "From acquisition date to sale date."],
    ["Fees & shipping", formatCurrency(c.fees), c.revenue ? `${formatPercentage(c.fees / c.revenue)} of revenue.` : ""],
    ["Cost of watches sold", formatCurrency(c.cogs), "Purchase cost plus parts."],
    ["Operating expenses", formatCurrency(c.opex), "Tools, supplies, software, shipping, marketing."],
    [
      "Written off",
      formatCurrency(c.writeOffs),
      c.watchesWrittenOff
        ? `${c.watchesWrittenOff} watch${c.watchesWrittenOff === 1 ? "" : "es"} broken beyond repair. Purchase cost plus parts.`
        : "Purchase cost plus parts of watches broken beyond repair.",
    ],
    ["Profit before expenses", formatCurrency(c.grossProfit), "Sale price − fees − shipping − cost."],
    ["Reselling + service revenue", formatCurrency(data.combined.current.revenue), ""],
    ["Reselling + service profit", formatCurrency(data.combined.current.netProfit), "Net reselling profit plus service profit."],
  ];
  return (
    <details className="group rounded-xl bg-card shadow-card">
      <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
        More numbers
        <span className="text-xs font-normal text-muted-foreground group-open:hidden">Show</span>
        <span className="hidden text-xs font-normal text-muted-foreground group-open:inline">Hide</span>
      </summary>
      <dl className="grid grid-cols-1 gap-x-8 border-t border-border px-6 py-4 sm:grid-cols-2">
        {rows.map(([k, v, hint]) => (
          <div key={k} className="flex items-baseline justify-between gap-4 border-b border-border py-2.5 last:border-0 sm:[&:nth-last-child(2)]:border-0">
            <dt className="text-sm text-muted-foreground">
              {k}
              {hint && <span className="block text-xs text-muted-foreground/80">{hint}</span>}
            </dt>
            <dd className="text-sm font-medium tabular-nums text-foreground">{v}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading dashboard" className="flex flex-col gap-6">
      <Skeleton className="h-9 w-64" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Skeleton className="h-72 rounded-xl lg:col-span-3" />
        <Skeleton className="h-72 rounded-xl lg:col-span-2" />
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
