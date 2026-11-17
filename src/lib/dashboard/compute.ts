/**
 * Dashboard numbers, computed from raw rows. Pure: no DB, no clock (pass `today`),
 * so every figure is unit-tested in src/__tests__/unit/dashboard-compute.test.ts.
 *
 * Definitions (shown to the user as tooltips; keep in sync with the UI copy):
 *   fees         = platform fee + shipping & insurance
 *   cost basis   = purchase cost + parts
 *   gross profit = sale price − fees − cost basis          (per sale, src/lib/profit.ts)
 *   write-offs   = cost basis of watches written off in the period (broken beyond repair)
 *   net profit   = gross profit − operating expenses − write-offs in the period
 *   margin       = gross profit ÷ revenue
 */
import { saleFees, saleProfit } from "../profit";
import { estimateFee, feeRateFor, type PlatformFees } from "../platform-fees";

// ---------- input rows (only the fields we read) ----------
export interface WatchRow {
  id: number;
  brand: string;
  model: string;
  status: string;
  baseCost: number;
  acquisitionDate: string;
  askingPrice?: number | null;
  listedDate?: string | null;
  listedPlatform?: string | null;
  writtenOffDate?: string | null;
}
export interface PartRow { watchId: number; cost: number }
export interface SaleRow {
  watchId: number;
  saleDate: string;
  platform: string;
  grossSalePrice: number;
  platformFee?: number | null;
  shippingInsurance?: number | null;
}
export interface ExpenseRow { date: string; amount: number }
export interface ServiceJobRow {
  id: number;
  status: string;
  finalCost?: number | null;
  isPaid?: number | null;
  dateReceived?: string | null;
  dateCompleted?: string | null;
  createdAt?: string | Date | null;
}
export interface ServicePartRow { serviceJobId: number; cost: number; quantity?: number | null }

export interface DashboardInput {
  watches: WatchRow[];
  parts: PartRow[];
  sales: SaleRow[];
  expenses: ExpenseRow[];
  serviceJobs: ServiceJobRow[];
  serviceParts: ServicePartRow[];
  platformFees: PlatformFees;
  /** YYYY-MM-DD */
  today: string;
}

/** Inclusive ISO date range. `null` means all time. */
export interface DateRange { from: string; to: string }

// ---------- thresholds for "needs attention" ----------
export const ATTENTION = {
  /** Listed longer than this → suggest a price drop. */
  listedDays: 45,
  /** In modding longer than this (since acquisition). */
  moddingDays: 45,
  /** Bought this long ago and still not listed. */
  unlistedDays: 60,
} as const;

// ---------- outputs ----------
export interface ResellingTotals {
  revenue: number;
  fees: number;
  cogs: number;
  grossProfit: number;
  opex: number;
  /** Cost basis of watches written off in the period. */
  writeOffs: number;
  watchesWrittenOff: number;
  netProfit: number;
  /** null when there was no revenue. */
  margin: number | null;
  /** Gross profit ÷ cost basis; null without sales. */
  roi: number | null;
  watchesSold: number;
  avgDaysToSell: number | null;
}

export interface MonthPoint {
  month: string; // YYYY-MM
  revenue: number;
  fees: number;
  cogs: number;
  opex: number;
  writeOffs: number;
  grossProfit: number;
  netProfit: number;
  sold: number;
}

export interface PlatformRow {
  platform: string;
  sold: number;
  revenue: number;
  fees: number;
  profit: number;
  margin: number | null;
  feeRate: number | null;
}

export interface BrandRow { brand: string; sold: number; profit: number; avgProfit: number }

export interface ServiceTotals {
  revenue: number;
  partsCost: number;
  profit: number;
  completed: number;
  avgTurnaroundDays: number | null;
}

export type ActionSeverity = "serious" | "warning" | "info";
export interface ActionItem {
  id: string;
  severity: ActionSeverity;
  title: string;
  detail: string;
  href: string;
  /** Sort key within a severity: bigger = more urgent. */
  weight: number;
}

export interface Dashboard {
  range: DateRange | null;
  previousRange: DateRange | null;
  today: string;
  reselling: {
    current: ResellingTotals;
    previous: ResellingTotals | null;
    /** Every month in the range (gaps filled with zeros), oldest first. */
    monthly: MonthPoint[];
    /** The 12 months ending at the range end (or today), for sparklines. */
    trend: MonthPoint[];
    platforms: PlatformRow[];
    brands: BrandRow[];
    timeToSell: { buckets: { label: string; count: number }[]; median: number | null };
  };
  stock: {
    count: number;
    cost: number;
    byStage: { status: string; count: number; cost: number }[];
    listed: { count: number; asking: number; expectedProfit: number; withoutAsk: number };
    aging: { label: string; count: number; cost: number }[];
    byBrand: { brand: string; count: number; cost: number }[];
  };
  actions: ActionItem[];
  service: {
    current: ServiceTotals;
    previous: ServiceTotals | null;
    pending: number;
    active: number;
    unpaid: { count: number; amount: number };
  };
  combined: {
    current: { revenue: number; netProfit: number };
    previous: { revenue: number; netProfit: number } | null;
  };
}

// ---------- date helpers (UTC, ISO strings) ----------
const DAY = 86_400_000;
const toMs = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
const toIso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const daysBetween = (from: string, to: string) => Math.round((toMs(to) - toMs(from)) / DAY);
const inRange = (date: string | null | undefined, r: DateRange | null) =>
  !!date && (!r || (date >= r.from && date <= r.to));

function isoOf(d: string | Date | null | undefined): string | null {
  if (!d) return null;
  if (typeof d === "string") return d.slice(0, 10);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/** The same number of days immediately before `r`. */
export function previousRange(r: DateRange): DateRange {
  const len = daysBetween(r.from, r.to) + 1;
  return { from: toIso(toMs(r.from) - len * DAY), to: toIso(toMs(r.from) - DAY) };
}

function monthsBetween(fromMonth: string, toMonth: string): string[] {
  const out: string[] = [];
  let y = +fromMonth.slice(0, 4);
  let m = +fromMonth.slice(5, 7);
  const endY = +toMonth.slice(0, 4);
  const endM = +toMonth.slice(5, 7);
  while (y < endY || (y === endY && m <= endM)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    if (++m > 12) {
      m = 1;
      y++;
    }
    if (out.length > 600) break; // guard against bad data
  }
  return out;
}

function shiftMonth(month: string, delta: number): string {
  const total = +month.slice(0, 4) * 12 + (+month.slice(5, 7) - 1) + delta;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

const ratio = (a: number, b: number) => (b > 0 ? a / b : null);

const euro = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

// ---------- main ----------
export function computeDashboard(input: DashboardInput, range: DateRange | null): Dashboard {
  const { watches, parts, sales, expenses, serviceJobs, serviceParts, platformFees, today } = input;

  const partsByWatch = new Map<number, number>();
  for (const p of parts) partsByWatch.set(p.watchId, (partsByWatch.get(p.watchId) ?? 0) + p.cost);
  const watchById = new Map(watches.map((w) => [w.id, w]));
  const costBasis = (w: WatchRow | undefined) => (w ? w.baseCost + (partsByWatch.get(w.id) ?? 0) : 0);

  // Per-sale facts, computed once.
  const saleFacts = sales.map((s) => {
    const w = watchById.get(s.watchId);
    const cogs = costBasis(w);
    return {
      sale: s,
      watch: w,
      cogs,
      fees: saleFees(s),
      profit: saleProfit(s, cogs),
      daysToSell: w ? daysBetween(w.acquisitionDate, s.saleDate) : null,
    };
  });

  const writtenOff = watches
    .filter((w) => w.status === "Written off" && w.writtenOffDate)
    .map((w) => ({ date: w.writtenOffDate!, loss: costBasis(w) }));

  const resellingTotals = (r: DateRange | null): ResellingTotals => {
    const facts = saleFacts.filter((f) => inRange(f.sale.saleDate, r));
    const revenue = facts.reduce((s, f) => s + f.sale.grossSalePrice, 0);
    const fees = facts.reduce((s, f) => s + f.fees, 0);
    const cogs = facts.reduce((s, f) => s + f.cogs, 0);
    const grossProfit = revenue - fees - cogs;
    const opex = expenses.filter((e) => inRange(e.date, r)).reduce((s, e) => s + e.amount, 0);
    const lost = writtenOff.filter((x) => inRange(x.date, r));
    const writeOffs = lost.reduce((s, x) => s + x.loss, 0);
    const days = facts.map((f) => f.daysToSell).filter((d): d is number => d !== null);
    return {
      revenue,
      fees,
      cogs,
      grossProfit,
      opex,
      writeOffs,
      watchesWrittenOff: lost.length,
      netProfit: grossProfit - opex - writeOffs,
      margin: ratio(grossProfit, revenue),
      roi: ratio(grossProfit, cogs),
      watchesSold: facts.length,
      avgDaysToSell: days.length ? days.reduce((a, b) => a + b, 0) / days.length : null,
    };
  };

  const prevRange = range ? previousRange(range) : null;

  // Monthly series. `scoped` only counts rows inside the range, so the bars add up to the
  // headline numbers; `full` uses whole months and feeds the 12-month sparklines.
  const emptyMonth = (month: string): MonthPoint => ({
    month, revenue: 0, fees: 0, cogs: 0, opex: 0, writeOffs: 0, grossProfit: 0, netProfit: 0, sold: 0,
  });
  const buildMonths = (r: DateRange | null) => {
    const map = new Map<string, MonthPoint>();
    const at = (m: string) => {
      let p = map.get(m);
      if (!p) map.set(m, (p = emptyMonth(m)));
      return p;
    };
    for (const f of saleFacts) {
      if (!inRange(f.sale.saleDate, r)) continue;
      const p = at(f.sale.saleDate.slice(0, 7));
      p.revenue += f.sale.grossSalePrice;
      p.fees += f.fees;
      p.cogs += f.cogs;
      p.sold += 1;
    }
    for (const e of expenses) if (inRange(e.date, r)) at(e.date.slice(0, 7)).opex += e.amount;
    for (const x of writtenOff) if (inRange(x.date, r)) at(x.date.slice(0, 7)).writeOffs += x.loss;
    for (const p of map.values()) {
      p.grossProfit = p.revenue - p.fees - p.cogs;
      p.netProfit = p.grossProfit - p.opex - p.writeOffs;
    }
    return map;
  };
  const scoped = buildMonths(range);
  const full = range ? buildMonths(null) : scoped;
  const seriesFor = (map: Map<string, MonthPoint>, months: string[]) =>
    months.map((m) => map.get(m) ?? emptyMonth(m));

  const endMonth = (range?.to ?? today).slice(0, 7);
  const dataMonths = [...scoped.keys()].sort();
  const startMonth = range
    ? range.from.slice(0, 7)
    : (dataMonths[0] && dataMonths[0] < endMonth ? dataMonths[0] : endMonth);
  const monthly = seriesFor(scoped, monthsBetween(startMonth, endMonth));
  const trend = seriesFor(full, monthsBetween(shiftMonth(endMonth, -11), endMonth));

  // Platforms & brands (current range).
  const current = saleFacts.filter((f) => inRange(f.sale.saleDate, range));
  const platformMap = new Map<string, PlatformRow>();
  for (const f of current) {
    const key = f.sale.platform;
    const row =
      platformMap.get(key) ??
      { platform: key, sold: 0, revenue: 0, fees: 0, profit: 0, margin: null, feeRate: null };
    row.sold += 1;
    row.revenue += f.sale.grossSalePrice;
    row.fees += f.fees;
    row.profit += f.profit;
    platformMap.set(key, row);
  }
  const platforms = [...platformMap.values()]
    .map((p) => ({ ...p, margin: ratio(p.profit, p.revenue), feeRate: ratio(p.fees, p.revenue) }))
    .sort((a, b) => b.profit - a.profit);

  const brandMap = new Map<string, { sold: number; profit: number }>();
  for (const f of current) {
    if (!f.watch) continue;
    const b = brandMap.get(f.watch.brand) ?? { sold: 0, profit: 0 };
    b.sold += 1;
    b.profit += f.profit;
    brandMap.set(f.watch.brand, b);
  }
  const brands = [...brandMap.entries()]
    .map(([brand, b]) => ({ brand, sold: b.sold, profit: b.profit, avgProfit: b.profit / b.sold }))
    .sort((a, b) => b.profit - a.profit);

  const sellDays = current.map((f) => f.daysToSell).filter((d): d is number => d !== null);
  const timeToSell = {
    buckets: [
      { label: "Under 7 days", count: sellDays.filter((d) => d < 7).length },
      { label: "7–29 days", count: sellDays.filter((d) => d >= 7 && d < 30).length },
      { label: "30–89 days", count: sellDays.filter((d) => d >= 30 && d < 90).length },
      { label: "90+ days", count: sellDays.filter((d) => d >= 90).length },
    ],
    median: median(sellDays),
  };

  // Stock: always "as of today", not period-dependent.
  // Sold and written-off watches have left stock.
  const unsold = watches.filter((w) => w.status !== "Sold" && w.status !== "Written off");
  const stages = ["In Inventory", "Modding", "Listed"];
  const byStage = stages.map((status) => {
    const ws = unsold.filter((w) => w.status === status);
    return { status, count: ws.length, cost: ws.reduce((s, w) => s + costBasis(w), 0) };
  });
  const otherStage = unsold.filter((w) => !stages.includes(w.status));
  if (otherStage.length) {
    byStage.push({ status: "Other", count: otherStage.length, cost: otherStage.reduce((s, w) => s + costBasis(w), 0) });
  }

  const listedWatches = unsold.filter((w) => w.status === "Listed");
  const priced = listedWatches.filter((w) => (w.askingPrice ?? 0) > 0);
  const expectedProfitOf = (w: WatchRow) => {
    const ask = w.askingPrice ?? 0;
    const rate = feeRateFor(platformFees, w.listedPlatform);
    return ask - (rate === null ? 0 : estimateFee(ask, rate)) - costBasis(w);
  };
  const listed = {
    count: listedWatches.length,
    asking: priced.reduce((s, w) => s + (w.askingPrice ?? 0), 0),
    expectedProfit: priced.reduce((s, w) => s + expectedProfitOf(w), 0),
    withoutAsk: listedWatches.length - priced.length,
  };

  const ageOf = (w: WatchRow) => daysBetween(w.acquisitionDate, today);
  const agingDefs: [string, number, number][] = [
    ["0–30 days", 0, 30],
    ["31–60 days", 31, 60],
    ["61–90 days", 61, 90],
    ["Over 90 days", 91, Infinity],
  ];
  const aging = agingDefs.map(([label, lo, hi]) => {
    const ws = unsold.filter((w) => {
      const a = Math.max(0, ageOf(w));
      return a >= lo && a <= hi;
    });
    return { label, count: ws.length, cost: ws.reduce((s, w) => s + costBasis(w), 0) };
  });

  const brandStock = new Map<string, { count: number; cost: number }>();
  for (const w of unsold) {
    const b = brandStock.get(w.brand) ?? { count: 0, cost: 0 };
    b.count += 1;
    b.cost += costBasis(w);
    brandStock.set(w.brand, b);
  }
  const byBrand = [...brandStock.entries()]
    .map(([brand, b]) => ({ brand, ...b }))
    .sort((a, b) => b.cost - a.cost);

  // Needs attention.
  const actions: ActionItem[] = [];
  const name = (w: WatchRow) => `${w.brand} ${w.model}`;
  for (const w of listedWatches) {
    if (!(w.askingPrice && w.askingPrice > 0)) {
      actions.push({
        id: `ask:${w.id}`,
        severity: "info",
        title: `Add an asking price for ${name(w)}`,
        detail: "It's listed without one, so expected profit can't be worked out.",
        href: `/inventory/${w.id}`,
        weight: 0,
      });
    }
    if (w.listedDate) {
      const d = daysBetween(w.listedDate, today);
      if (d > ATTENTION.listedDays) {
        const ep = w.askingPrice ? expectedProfitOf(w) : null;
        actions.push({
          id: `stale:${w.id}`,
          severity: "warning",
          title: `${name(w)} has been listed for ${d} days`,
          detail:
            ep !== null && ep > 0
              ? `Consider a price drop or another platform. There's room: expected profit is about ${euro.format(ep)}.`
              : "Consider a price drop or another platform.",
          href: `/inventory/${w.id}`,
          weight: d,
        });
      }
    }
  }
  for (const w of unsold) {
    const age = ageOf(w);
    if (w.status === "Modding" && age > ATTENTION.moddingDays) {
      actions.push({
        id: `modding:${w.id}`,
        severity: "warning",
        title: `${name(w)} is still in modding`,
        detail: `Bought ${age} days ago. Finish it and list it to free up ${euro.format(costBasis(w))}.`,
        href: `/inventory/${w.id}`,
        weight: age,
      });
    }
    if (w.status === "In Inventory" && age > ATTENTION.unlistedDays) {
      actions.push({
        id: `unlisted:${w.id}`,
        severity: "warning",
        title: `${name(w)} isn't listed yet`,
        detail: `Bought ${age} days ago. ${euro.format(costBasis(w))} is tied up in it.`,
        href: `/inventory/${w.id}`,
        weight: age,
      });
    }
  }

  const pending = serviceJobs.filter((j) => j.status === "Pending");
  if (pending.length) {
    actions.push({
      id: "service:pending",
      severity: "serious",
      title: `${pending.length} service request${pending.length === 1 ? "" : "s"} waiting for a reply`,
      detail: "Customers are waiting for you to accept or refuse.",
      href: "/services?status=Pending",
      weight: pending.length,
    });
  }
  const unpaidJobs = serviceJobs.filter(
    (j) => (j.status === "Completed" || j.status === "Collected") && !j.isPaid && (j.finalCost ?? 0) > 0
  );
  const unpaidAmount = unpaidJobs.reduce((s, j) => s + (j.finalCost ?? 0), 0);
  if (unpaidJobs.length) {
    actions.push({
      id: "service:unpaid",
      severity: "serious",
      title: `${unpaidJobs.length} finished service job${unpaidJobs.length === 1 ? "" : "s"} not paid`,
      detail: `${euro.format(unpaidAmount)} outstanding.`,
      href: "/services",
      weight: unpaidAmount,
    });
  }
  const severityOrder: Record<ActionSeverity, number> = { serious: 0, warning: 1, info: 2 };
  actions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity] || b.weight - a.weight);

  // Service: completed jobs by completion date.
  const serviceTotals = (r: DateRange | null): ServiceTotals => {
    const done = serviceJobs.filter(
      (j) =>
        (j.status === "Completed" || j.status === "Collected") &&
        inRange(j.dateCompleted ?? isoOf(j.createdAt), r)
    );
    const ids = new Set(done.map((j) => j.id));
    const revenue = done.reduce((s, j) => s + (j.finalCost ?? 0), 0);
    const partsCost = serviceParts
      .filter((p) => ids.has(p.serviceJobId))
      .reduce((s, p) => s + p.cost * (p.quantity ?? 1), 0);
    const turn = done
      .filter((j) => j.dateReceived && j.dateCompleted)
      .map((j) => daysBetween(j.dateReceived!.slice(0, 10), j.dateCompleted!.slice(0, 10)));
    return {
      revenue,
      partsCost,
      profit: revenue - partsCost,
      completed: done.length,
      avgTurnaroundDays: turn.length ? turn.reduce((a, b) => a + b, 0) / turn.length : null,
    };
  };

  const resCur = resellingTotals(range);
  const resPrev = prevRange ? resellingTotals(prevRange) : null;
  const svcCur = serviceTotals(range);
  const svcPrev = prevRange ? serviceTotals(prevRange) : null;
  const closed = new Set(["Completed", "Collected", "Refused", "Rejected", "Cancelled"]);

  return {
    range,
    previousRange: prevRange,
    today,
    reselling: { current: resCur, previous: resPrev, monthly, trend, platforms, brands, timeToSell },
    stock: {
      count: unsold.length,
      cost: unsold.reduce((s, w) => s + costBasis(w), 0),
      byStage,
      listed,
      aging,
      byBrand,
    },
    actions,
    service: {
      current: svcCur,
      previous: svcPrev,
      pending: pending.length,
      active: serviceJobs.filter((j) => j.status !== "Pending" && !closed.has(j.status)).length,
      unpaid: { count: unpaidJobs.length, amount: unpaidAmount },
    },
    combined: {
      current: { revenue: resCur.revenue + svcCur.revenue, netProfit: resCur.netProfit + svcCur.profit },
      previous:
        resPrev && svcPrev
          ? { revenue: resPrev.revenue + svcPrev.revenue, netProfit: resPrev.netProfit + svcPrev.profit }
          : null,
    },
  };
}
