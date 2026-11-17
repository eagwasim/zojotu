import { describe, it, expect } from "vitest";
import {
  computeDashboard,
  previousRange,
  type DashboardInput,
} from "@/lib/dashboard/compute";
import { saleFees, saleNetRevenue, saleProfit } from "@/lib/profit";

describe("profit helpers", () => {
  const sale = { grossSalePrice: 350, platformFee: 22.75, shippingInsurance: 15 };
  it("sums fees and shipping", () => expect(saleFees(sale)).toBe(37.75));
  it("nets fees off the sale price", () => expect(saleNetRevenue(sale)).toBe(312.25));
  it("subtracts cost basis after fees", () => expect(saleProfit(sale, 265)).toBe(47.25));
  it("treats missing fees as zero", () =>
    expect(saleProfit({ grossSalePrice: 100, platformFee: null }, 60)).toBe(40));
});

describe("previousRange", () => {
  it("is the same length, immediately before", () => {
    expect(previousRange({ from: "2026-11-01", to: "2026-11-30" })).toEqual({ from: "2026-10-02", to: "2026-10-31" });
    expect(previousRange({ from: "2026-03-01", to: "2026-03-01" })).toEqual({ from: "2026-02-28", to: "2026-02-28" });
  });
});

function fixture(): DashboardInput {
  return {
    today: "2026-11-17",
    platformFees: { eBay: 0.1 },
    watches: [
      // sold in Oct: cost basis 200 + 50 parts = 250
      { id: 1, brand: "Seiko", model: "SKX007", status: "Sold", baseCost: 200, acquisitionDate: "2026-09-01" },
      // sold in Nov: cost basis 100
      { id: 2, brand: "Orient", model: "Bambino", status: "Sold", baseCost: 100, acquisitionDate: "2026-10-27" },
      // listed 60 days ago with an ask
      { id: 3, brand: "Seiko", model: "Presage", status: "Listed", baseCost: 300, acquisitionDate: "2026-08-01", askingPrice: 500, listedDate: "2026-09-18", listedPlatform: "ebay" },
      // listed, no ask, recent
      { id: 4, brand: "Tudor", model: "Black Bay", status: "Listed", baseCost: 1500, acquisitionDate: "2026-11-01", listedDate: "2026-11-10" },
      // modding for 100 days
      { id: 5, brand: "Citizen", model: "Promaster", status: "Modding", baseCost: 80, acquisitionDate: "2026-08-09" },
      // in inventory, fresh
      { id: 6, brand: "Casio", model: "G-Shock", status: "In Inventory", baseCost: 40, acquisitionDate: "2026-11-10" },
    ],
    parts: [{ watchId: 1, cost: 50 }],
    sales: [
      { watchId: 1, saleDate: "2026-10-15", platform: "eBay", grossSalePrice: 400, platformFee: 40, shippingInsurance: 10 },
      { watchId: 2, saleDate: "2026-11-05", platform: "Private Sale", grossSalePrice: 200, platformFee: 0, shippingInsurance: 0 },
    ],
    expenses: [
      { date: "2026-10-03", amount: 30 },
      { date: "2026-11-02", amount: 20 },
    ],
    serviceJobs: [
      { id: 1, status: "Pending" },
      { id: 2, status: "Completed", finalCost: 120, isPaid: 0, dateReceived: "2026-11-01", dateCompleted: "2026-11-06" },
      { id: 3, status: "In Progress" },
    ],
    serviceParts: [{ serviceJobId: 2, cost: 15, quantity: 2 }],
  };
}

describe("computeDashboard", () => {
  const nov = { from: "2026-11-01", to: "2026-11-30" };

  it("all time: profit is net of fees, shipping and overheads", () => {
    const d = computeDashboard(fixture(), null);
    const r = d.reselling.current;
    expect(r.revenue).toBe(600);
    expect(r.fees).toBe(50);
    expect(r.cogs).toBe(350);
    expect(r.grossProfit).toBe(200);
    expect(r.opex).toBe(50);
    expect(r.netProfit).toBe(150);
    expect(r.margin).toBeCloseTo(200 / 600);
    expect(d.reselling.previous).toBeNull();
  });

  it("period and previous period", () => {
    const d = computeDashboard(fixture(), nov);
    expect(d.previousRange).toEqual({ from: "2026-10-02", to: "2026-10-31" });
    expect(d.reselling.current).toMatchObject({ revenue: 200, grossProfit: 100, opex: 20, netProfit: 80, watchesSold: 1 });
    expect(d.reselling.previous).toMatchObject({ revenue: 400, grossProfit: 100, opex: 30, netProfit: 70, watchesSold: 1 });
  });

  it("no revenue means no margin, not 0%", () => {
    const d = computeDashboard(fixture(), { from: "2026-01-01", to: "2026-01-31" });
    expect(d.reselling.current.margin).toBeNull();
    expect(d.reselling.current.roi).toBeNull();
  });

  it("fills empty months and builds a 12-month trend", () => {
    const d = computeDashboard(fixture(), null);
    expect(d.reselling.monthly.map((m) => m.month)).toEqual(["2026-10", "2026-11"]);
    expect(d.reselling.trend).toHaveLength(12);
    expect(d.reselling.trend[0].month).toBe("2025-12");
    expect(d.reselling.trend.at(-1)).toMatchObject({ month: "2026-11", netProfit: 80 });
    const q = computeDashboard(fixture(), { from: "2026-08-15", to: "2026-11-17" });
    expect(q.reselling.monthly.map((m) => m.month)).toEqual(["2026-08", "2026-09", "2026-10", "2026-11"]);
    expect(q.reselling.monthly[0]).toMatchObject({ revenue: 0, netProfit: 0 });
  });

  it("monthly bars add up to the headline, even when the range starts mid-month", () => {
    const r = { from: "2026-10-10", to: "2026-11-17" };
    const d = computeDashboard(fixture(), r);
    const sum = (k: "revenue" | "netProfit" | "opex") => d.reselling.monthly.reduce((s, m) => s + m[k], 0);
    expect(sum("revenue")).toBe(d.reselling.current.revenue);
    expect(sum("netProfit")).toBe(d.reselling.current.netProfit);
    // the Oct 3 expense is outside the range and must not appear in October's bar
    expect(sum("opex")).toBe(20);
    // sparklines still use whole months
    expect(d.reselling.trend.find((m) => m.month === "2026-10")?.opex).toBe(30);
  });

  it("platform profit adds up to gross profit", () => {
    const d = computeDashboard(fixture(), null);
    const sum = d.reselling.platforms.reduce((s, p) => s + p.profit, 0);
    expect(sum).toBe(d.reselling.current.grossProfit);
    const byName = Object.fromEntries(d.reselling.platforms.map((p) => [p.platform, p]));
    expect(byName["Private Sale"]).toMatchObject({ profit: 100, margin: 0.5, feeRate: 0 });
    expect(byName["eBay"]).toMatchObject({ profit: 100, margin: 0.25, feeRate: 0.125 });
  });

  it("stock is as of today: cost by stage, listed expectations, aging", () => {
    const d = computeDashboard(fixture(), nov);
    expect(d.stock.count).toBe(4);
    expect(d.stock.cost).toBe(1920);
    expect(d.stock.byStage).toEqual([
      { status: "In Inventory", count: 1, cost: 40 },
      { status: "Modding", count: 1, cost: 80 },
      { status: "Listed", count: 2, cost: 1800 },
    ]);
    // Presage: 500 ask − 50 fee (10%, matched case-insensitively) − 300 cost
    expect(d.stock.listed).toEqual({ count: 2, asking: 500, expectedProfit: 150, withoutAsk: 1 });
    expect(d.stock.aging.map((a) => a.count)).toEqual([2, 0, 0, 2]);
  });

  it("time to sell uses the median", () => {
    const d = computeDashboard(fixture(), null);
    // 44 days and 9 days
    expect(d.reselling.timeToSell.median).toBe(26.5);
    expect(d.reselling.timeToSell.buckets.map((b) => b.count)).toEqual([0, 1, 1, 0]);
  });

  it("flags what needs attention, most urgent first", () => {
    const d = computeDashboard(fixture(), null);
    const ids = d.actions.map((a) => a.id);
    expect(ids.slice(0, 2).sort()).toEqual(["service:pending", "service:unpaid"]);
    expect(ids).toContain("stale:3"); // listed 60 days
    expect(ids).toContain("modding:5"); // 100 days in modding
    expect(ids).toContain("ask:4"); // listed without a price
    expect(ids).not.toContain("unlisted:6"); // bought 7 days ago
    expect(d.actions.at(-1)?.severity).toBe("info");
    expect(d.actions.find((a) => a.id === "service:unpaid")?.detail).toContain("€120");
  });

  it("service totals by completion date", () => {
    const d = computeDashboard(fixture(), nov);
    expect(d.service.current).toEqual({ revenue: 120, partsCost: 30, profit: 90, completed: 1, avgTurnaroundDays: 5 });
    expect(d.service.previous?.revenue).toBe(0);
    expect(d.service).toMatchObject({ pending: 1, active: 1, unpaid: { count: 1, amount: 120 } });
    expect(d.combined.current).toEqual({ revenue: 320, netProfit: 170 });
  });

  describe("write-offs", () => {
    // Broken beyond repair in November: 150 paid + 30 parts = 180 lost. Bought 200 days ago,
    // so it would be flagged as unlisted if it still counted as stock.
    const withWriteOff = (): DashboardInput => {
      const f = fixture();
      f.watches.push({
        id: 7, brand: "Omega", model: "Seamaster", status: "Written off",
        baseCost: 150, acquisitionDate: "2026-04-01", writtenOffDate: "2026-11-12",
      });
      f.parts.push({ watchId: 7, cost: 30 });
      return f;
    };

    it("count the cost basis as a loss in net profit, in the write-off period", () => {
      const d = computeDashboard(withWriteOff(), nov);
      expect(d.reselling.current).toMatchObject({
        grossProfit: 100, opex: 20, writeOffs: 180, watchesWrittenOff: 1, netProfit: -100,
      });
      expect(d.reselling.previous).toMatchObject({ writeOffs: 0, netProfit: 70 });
      expect(d.reselling.monthly.at(-1)).toMatchObject({ month: "2026-11", writeOffs: 180, netProfit: -100 });
      expect(d.combined.current.netProfit).toBe(-10);
    });

    it("don't touch revenue, margin or gross profit", () => {
      const before = computeDashboard(fixture(), null).reselling.current;
      const after = computeDashboard(withWriteOff(), null).reselling.current;
      expect(after).toMatchObject({
        revenue: before.revenue, grossProfit: before.grossProfit, margin: before.margin, watchesSold: 2,
      });
      expect(after.netProfit).toBe(before.netProfit - 180);
    });

    it("leave stock and raise no attention items", () => {
      const d = computeDashboard(withWriteOff(), null);
      expect(d.stock.count).toBe(4);
      expect(d.stock.cost).toBe(1920);
      expect(d.actions.map((a) => a.id).some((id) => id.endsWith(":7"))).toBe(false);
    });
  });
});
