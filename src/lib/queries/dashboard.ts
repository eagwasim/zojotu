import { db } from "../db";
import { watches, parts, sales, expenses, serviceJobs, serviceJobParts } from "../db/schema";
import { eq, sql, and, ne } from "drizzle-orm";

export interface SalesVelocity {
  bestMonth: { month: string; profit: number } | null;
  worstMonth: { month: string; profit: number } | null;
  salesTrend: "up" | "down" | "flat";
  sellThroughRate: number;
  timeToSellDistribution: {
    under7: number;
    days7to30: number;
    days30to90: number;
    over90: number;
  };
  stagnatingInventory: {
    id: number;
    brand: string;
    model: string;
    daysInInventory: number;
  }[];
}

export interface BrandAnalytics {
  mostProfitableBrands: {
    brand: string;
    totalProfit: number;
    unitsSold: number;
    avgProfit: number;
  }[];
  brandInventoryDistribution: { brand: string; count: number }[];
}

export interface PlatformPerformance {
  revenueByPlatform: {
    platform: string;
    revenue: number;
    profit: number;
    fees: number;
    margin: number;
  }[];
  bestPlatformByMargin: { platform: string; margin: number } | null;
  totalFees: number;
  feePercentage: number;
}

export interface ServiceKPIs {
  serviceRevenue: number;
  servicePartsCost: number;
  serviceProfit: number;
  activeServiceJobs: number;
  completedServiceJobs: number;
  avgTurnaroundDays: number;
}

export interface DashboardKPIs {
  grossRevenue: number;
  totalCogs: number;
  grossProfit: number;
  marginPercent: number;
  roiPercent: number;
  watchesSold: number;
  avgDaysToSell: number;
  activeInventoryValue: number;
  totalOpEx: number;
  netProfit: number;
  totalWatches: number;
  watchesByStatus: { status: string; count: number }[];
  monthlyProfits: { month: string; revenue: number; cogs: number; profit: number }[];
  salesVelocity: SalesVelocity;
  brandAnalytics: BrandAnalytics;
  platformPerformance: PlatformPerformance;
  serviceKPIs: ServiceKPIs;
  combinedRevenue: number;
  combinedProfit: number;
}

export async function getDashboardKPIs(period?: {
  from?: string;
  to?: string;
}): Promise<DashboardKPIs> {
  const allWatches = await db.select().from(watches);
  const allParts = await db.select().from(parts);
  const rawSales = await db.select().from(sales);
  const rawExpenses = await db.select().from(expenses);

  const allSales = period?.from || period?.to
    ? rawSales.filter((s: any) => {
        if (period.from && s.saleDate < period.from) return false;
        if (period.to && s.saleDate > period.to) return false;
        return true;
      })
    : rawSales;

  const allExpenses = period?.from || period?.to
    ? rawExpenses.filter((e: any) => {
        if (period.from && e.date < period.from) return false;
        if (period.to && e.date > period.to) return false;
        return true;
      })
    : rawExpenses;

  const partsPerWatch = new Map<number, number>();
  for (const part of allParts) {
    partsPerWatch.set(
      part.watchId,
      (partsPerWatch.get(part.watchId) || 0) + part.cost
    );
  }

  const soldWatches = allWatches.filter((w: any) => w.status === "Sold");
  const unsoldWatches = allWatches.filter((w: any) => w.status !== "Sold");

  let grossRevenue = 0;
  let totalCogs = 0;
  let totalDays = 0;
  let salesCount = 0;

  const daysToSellList: number[] = [];
  const brandProfitMap = new Map<string, { totalProfit: number; unitsSold: number }>();
  const platformMap = new Map<string, { revenue: number; profit: number; fees: number }>();

  for (const sale of allSales) {
    grossRevenue += sale.grossSalePrice;
    const watch = allWatches.find((w: any) => w.id === sale.watchId);
    if (watch) {
      const watchCogs = watch.baseCost + (partsPerWatch.get(watch.id) || 0);
      totalCogs += watchCogs;
      const acqDate = new Date(watch.acquisitionDate);
      const saleDate = new Date(sale.saleDate);
      const days = Math.round(
        (saleDate.getTime() - acqDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      totalDays += days;
      daysToSellList.push(days);
      salesCount++;

      const saleProfit = sale.grossSalePrice - watchCogs;
      const brandEntry = brandProfitMap.get(watch.brand) || { totalProfit: 0, unitsSold: 0 };
      brandEntry.totalProfit += saleProfit;
      brandEntry.unitsSold += 1;
      brandProfitMap.set(watch.brand, brandEntry);

      const fees = (sale.platformFee || 0) + (sale.shippingInsurance || 0);
      const platEntry = platformMap.get(sale.platform) || { revenue: 0, profit: 0, fees: 0 };
      platEntry.revenue += sale.grossSalePrice;
      platEntry.profit += sale.grossSalePrice - watchCogs - fees;
      platEntry.fees += fees;
      platformMap.set(sale.platform, platEntry);
    }
  }

  const grossProfit = grossRevenue - totalCogs;
  const marginPercent = grossRevenue > 0 ? grossProfit / grossRevenue : 0;
  const roiPercent = totalCogs > 0 ? grossProfit / totalCogs : 0;
  const avgDaysToSell = salesCount > 0 ? totalDays / salesCount : 0;

  let activeInventoryValue = 0;
  for (const watch of unsoldWatches) {
    activeInventoryValue += watch.baseCost + (partsPerWatch.get(watch.id) || 0);
  }

  const totalOpEx = allExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);
  const netProfit = grossProfit - totalOpEx;

  const statusCounts = new Map<string, number>();
  for (const watch of allWatches) {
    statusCounts.set(watch.status, (statusCounts.get(watch.status) || 0) + 1);
  }
  const watchesByStatus = Array.from(statusCounts.entries()).map(
    ([status, count]) => ({ status, count })
  );

  const monthlyMap = new Map<string, { revenue: number; cogs: number }>();
  for (const sale of allSales) {
    const month = sale.saleDate.substring(0, 7);
    const entry = monthlyMap.get(month) || { revenue: 0, cogs: 0 };
    entry.revenue += sale.grossSalePrice;
    const watch = allWatches.find((w: any) => w.id === sale.watchId);
    if (watch) {
      entry.cogs += watch.baseCost + (partsPerWatch.get(watch.id) || 0);
    }
    monthlyMap.set(month, entry);
  }
  const monthlyProfits = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { revenue, cogs }]) => ({
      month,
      revenue,
      cogs,
      profit: revenue - cogs,
    }));

  // Sales Velocity
  const timeToSellDistribution = {
    under7: daysToSellList.filter((d) => d < 7).length,
    days7to30: daysToSellList.filter((d) => d >= 7 && d < 30).length,
    days30to90: daysToSellList.filter((d) => d >= 30 && d < 90).length,
    over90: daysToSellList.filter((d) => d >= 90).length,
  };

  let bestMonth: SalesVelocity["bestMonth"] = null;
  let worstMonth: SalesVelocity["worstMonth"] = null;
  if (monthlyProfits.length > 0) {
    const sorted = [...monthlyProfits].sort((a, b) => b.profit - a.profit);
    bestMonth = { month: sorted[0].month, profit: sorted[0].profit };
    worstMonth = { month: sorted[sorted.length - 1].month, profit: sorted[sorted.length - 1].profit };
  }

  let salesTrend: SalesVelocity["salesTrend"] = "flat";
  if (monthlyProfits.length >= 2) {
    const latest = monthlyProfits[monthlyProfits.length - 1].revenue;
    const prior = monthlyProfits[monthlyProfits.length - 2].revenue;
    if (latest > prior) salesTrend = "up";
    else if (latest < prior) salesTrend = "down";
  }

  const sellThroughRate = allWatches.length > 0 ? salesCount / allWatches.length : 0;

  const now = new Date();
  const stagnatingInventory = unsoldWatches
    .map((w: any) => {
      const days = Math.round(
        (now.getTime() - new Date(w.acquisitionDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      return { id: w.id, brand: w.brand, model: w.model, daysInInventory: days };
    })
    .filter((w: any) => w.daysInInventory > 90)
    .sort((a: any, b: any) => b.daysInInventory - a.daysInInventory)
    .slice(0, 5);

  // Brand Analytics
  const mostProfitableBrands = Array.from(brandProfitMap.entries())
    .map(([brand, { totalProfit, unitsSold }]) => ({
      brand,
      totalProfit,
      unitsSold,
      avgProfit: unitsSold > 0 ? totalProfit / unitsSold : 0,
    }))
    .sort((a, b) => b.totalProfit - a.totalProfit)
    .slice(0, 10);

  const brandCounts = new Map<string, number>();
  for (const watch of unsoldWatches) {
    brandCounts.set(watch.brand, (brandCounts.get(watch.brand) || 0) + 1);
  }
  const brandInventoryDistribution = Array.from(brandCounts.entries())
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count);

  // Platform Performance
  const revenueByPlatform = Array.from(platformMap.entries())
    .map(([platform, data]) => ({
      platform,
      ...data,
      margin: data.revenue > 0 ? data.profit / data.revenue : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  let bestPlatformByMargin: PlatformPerformance["bestPlatformByMargin"] = null;
  if (revenueByPlatform.length > 0) {
    const best = revenueByPlatform.reduce((prev, curr) => {
      return curr.margin > prev.margin ? curr : prev;
    });
    bestPlatformByMargin = {
      platform: best.platform,
      margin: best.margin,
    };
  }

  const totalFees = revenueByPlatform.reduce((sum, p) => sum + p.fees, 0);
  const feePercentage = grossRevenue > 0 ? totalFees / grossRevenue : 0;

  // Service KPIs
  const allServiceJobs = await db.select().from(serviceJobs);
  const allServiceParts = await db.select().from(serviceJobParts);

  const filteredServiceJobs = period?.from || period?.to
    ? allServiceJobs.filter((j: any) => {
        const date = j.dateCompleted || j.createdAt;
        const dateStr = typeof date === "string" ? date : date?.toISOString?.()?.split("T")[0] || "";
        if (period.from && dateStr < period.from) return false;
        if (period.to && dateStr > period.to) return false;
        return true;
      })
    : allServiceJobs;

  const completedServiceJobs = filteredServiceJobs.filter(
    (j: any) => j.status === "Completed" || j.status === "Collected"
  );
  const activeServiceJobs = filteredServiceJobs.filter(
    (j: any) => !["Completed", "Collected", "Refused"].includes(j.status)
  );

  const serviceRevenue = completedServiceJobs.reduce(
    (sum: number, j: any) => sum + (j.finalCost || 0), 0
  );

  const completedJobIds = new Set(completedServiceJobs.map((j: any) => j.id));
  const servicePartsCost = allServiceParts
    .filter((p: any) => completedJobIds.has(p.serviceJobId))
    .reduce((sum: number, p: any) => sum + p.cost * (p.quantity || 1), 0);

  const serviceProfit = serviceRevenue - servicePartsCost;

  let avgTurnaroundDays = 0;
  const turnaroundJobs = completedServiceJobs.filter(
    (j: any) => j.dateReceived && j.dateCompleted
  );
  if (turnaroundJobs.length > 0) {
    const totalTurnaround = turnaroundJobs.reduce((sum: number, j: any) => {
      const received = new Date(j.dateReceived);
      const completed = new Date(j.dateCompleted);
      return sum + Math.round((completed.getTime() - received.getTime()) / (1000 * 60 * 60 * 24));
    }, 0);
    avgTurnaroundDays = totalTurnaround / turnaroundJobs.length;
  }

  const combinedRevenue = grossRevenue + serviceRevenue;
  const combinedProfit = netProfit + serviceProfit;

  return {
    grossRevenue,
    totalCogs,
    grossProfit,
    marginPercent,
    roiPercent,
    watchesSold: salesCount,
    avgDaysToSell,
    activeInventoryValue,
    totalOpEx,
    netProfit,
    totalWatches: allWatches.length,
    watchesByStatus,
    monthlyProfits,
    salesVelocity: {
      bestMonth,
      worstMonth,
      salesTrend,
      sellThroughRate,
      timeToSellDistribution,
      stagnatingInventory,
    },
    brandAnalytics: {
      mostProfitableBrands,
      brandInventoryDistribution,
    },
    platformPerformance: {
      revenueByPlatform,
      bestPlatformByMargin,
      totalFees,
      feePercentage,
    },
    serviceKPIs: {
      serviceRevenue,
      servicePartsCost,
      serviceProfit,
      activeServiceJobs: activeServiceJobs.length,
      completedServiceJobs: completedServiceJobs.length,
      avgTurnaroundDays,
    },
    combinedRevenue,
    combinedProfit,
  };
}
