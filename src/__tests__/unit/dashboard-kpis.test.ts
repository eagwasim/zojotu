import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  watches,
  parts,
  sales,
  expenses,
  serviceJobs,
  serviceJobParts,
} from "@/lib/db/schema";

const tables = new Map<unknown, unknown[]>();

vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: (table: unknown) => Promise.resolve(tables.get(table) ?? []),
    }),
  },
}));

import { getDashboardKPIs } from "@/lib/queries/dashboard";
import { saleFees, saleNetRevenue, saleProfit } from "@/lib/profit";

describe("profit helpers", () => {
  const sale = { grossSalePrice: 350, platformFee: 22.75, shippingInsurance: 15 };
  it("sums fees and shipping", () => expect(saleFees(sale)).toBe(37.75));
  it("nets fees off the sale price", () => expect(saleNetRevenue(sale)).toBe(312.25));
  it("subtracts cost basis after fees", () => expect(saleProfit(sale, 265)).toBe(47.25));
  it("treats missing fees as zero", () =>
    expect(saleProfit({ grossSalePrice: 100, platformFee: null }, 60)).toBe(40));
});

describe("getDashboardKPIs", () => {
  beforeEach(() => {
    tables.clear();
    tables.set(watches, [
      { id: 1, brand: "Seiko", model: "SKX007", baseCost: 200, status: "Sold", acquisitionDate: "2026-01-01" },
      { id: 2, brand: "Orient", model: "Bambino", baseCost: 100, status: "Sold", acquisitionDate: "2026-01-10" },
      { id: 3, brand: "Seiko", model: "SNK809", baseCost: 80, status: "Listed", acquisitionDate: "2026-02-01" },
    ]);
    tables.set(parts, [{ id: 1, watchId: 1, cost: 50 }]);
    tables.set(sales, [
      // revenue 400, fees 40 + 10, cost basis 250 → profit 100
      { id: 1, watchId: 1, saleDate: "2026-02-15", platform: "eBay", grossSalePrice: 400, platformFee: 40, shippingInsurance: 10 },
      // revenue 200, no fees, cost basis 100 → profit 100
      { id: 2, watchId: 2, saleDate: "2026-03-01", platform: "Private Sale", grossSalePrice: 200, platformFee: 0, shippingInsurance: 0 },
    ]);
    tables.set(expenses, [{ id: 1, date: "2026-02-01", amount: 30 }]);
    tables.set(serviceJobs, []);
    tables.set(serviceJobParts, []);
  });

  it("deducts platform fees and shipping from headline profit", async () => {
    const kpis = await getDashboardKPIs();
    expect(kpis.grossRevenue).toBe(600);
    expect(kpis.totalCogs).toBe(350);
    expect(kpis.grossProfit).toBe(200); // 600 − 50 fees − 350 cost
    expect(kpis.netProfit).toBe(170); // − 30 opex
    expect(kpis.marginPercent).toBeCloseTo(200 / 600, 6);
    expect(kpis.roiPercent).toBeCloseTo(200 / 350, 6);
  });

  it("agrees with per-platform profit", async () => {
    const kpis = await getDashboardKPIs();
    const platformTotal = kpis.platformPerformance.revenueByPlatform.reduce((s, p) => s + p.profit, 0);
    expect(platformTotal).toBe(kpis.grossProfit);
    expect(kpis.platformPerformance.totalFees).toBe(50);
  });

  it("nets fees out of monthly and brand profit", async () => {
    const kpis = await getDashboardKPIs();
    expect(kpis.monthlyProfits).toEqual([
      { month: "2026-02", revenue: 400, cogs: 250, profit: 100 },
      { month: "2026-03", revenue: 200, cogs: 100, profit: 100 },
    ]);
    const seiko = kpis.brandAnalytics.mostProfitableBrands.find((b) => b.brand === "Seiko");
    expect(seiko?.totalProfit).toBe(100);
  });

  it("respects the period filter", async () => {
    const kpis = await getDashboardKPIs({ from: "2026-03-01", to: "2026-03-31" });
    expect(kpis.grossRevenue).toBe(200);
    expect(kpis.grossProfit).toBe(100);
    expect(kpis.netProfit).toBe(100); // the February expense is outside the period
  });
});
