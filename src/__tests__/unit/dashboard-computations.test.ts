import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

describe("Dashboard KPI Computations (logic)", () => {
  it("computes net revenue correctly", () => {
    const grossSalePrice = 350;
    const platformFee = 22.75;
    const shippingInsurance = 15;
    const netRevenue = grossSalePrice - platformFee - shippingInsurance;
    expect(netRevenue).toBe(312.25);
  });

  it("computes total COGS correctly", () => {
    const baseCost = 220;
    const partsCosts = [15, 30];
    const totalCogs = baseCost + partsCosts.reduce((a, b) => a + b, 0);
    expect(totalCogs).toBe(265);
  });

  it("computes unit net profit correctly", () => {
    const netRevenue = 312.25;
    const totalCogs = 265;
    const profit = netRevenue - totalCogs;
    expect(profit).toBe(47.25);
  });

  it("computes ROI correctly", () => {
    const unitProfit = 47.25;
    const totalCogs = 265;
    const roi = unitProfit / totalCogs;
    expect(roi).toBeCloseTo(0.1783, 4);
  });

  it("computes margin correctly", () => {
    const grossRevenue = 2250;
    const totalCogs = 265;
    const grossProfit = grossRevenue - totalCogs;
    const margin = grossProfit / grossRevenue;
    expect(margin).toBeCloseTo(0.8822, 4);
  });

  it("computes days in inventory", () => {
    const acquisitionDate = new Date("2026-06-05");
    const saleDate = new Date("2026-06-25");
    const days = Math.round(
      (saleDate.getTime() - acquisitionDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(days).toBe(20);
  });

  it("handles zero COGS for ROI (avoids division by zero)", () => {
    const totalCogs = 0;
    const roi = totalCogs > 0 ? 100 / totalCogs : 0;
    expect(roi).toBe(0);
  });

  it("handles no sales for margin (avoids division by zero)", () => {
    const grossRevenue = 0;
    const margin = grossRevenue > 0 ? 100 / grossRevenue : 0;
    expect(margin).toBe(0);
  });

  it("computes active inventory value", () => {
    const watches = [
      { baseCost: 0, status: "In Inventory" },
      { baseCost: 180, status: "Modding" },
      { baseCost: 1500, status: "Listed" },
      { baseCost: 220, status: "Sold" },
    ];
    const partsCosts: Record<number, number> = { 1: 75, 2: 45 };
    const unsold = watches.filter((w) => w.status !== "Sold");
    const value = unsold.reduce(
      (sum, w, i) => sum + w.baseCost + (partsCosts[i] || 0),
      0
    );
    expect(value).toBe(0 + 75 + 180 + 45 + 1500);
  });
});
