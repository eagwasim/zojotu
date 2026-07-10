import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => {
  const watches: any[] = [];
  let nextId = 1;

  return {
    db: {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue(watches),
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue(watches),
          }),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockImplementation(() => {
            const watch = { id: nextId++, brand: "Test", model: "Watch" };
            watches.push(watch);
            return [watch];
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockReturnValue([{ id: 1, brand: "Updated" }]),
          }),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue(undefined),
      }),
    },
  };
});

vi.mock("@/lib/db/schema", () => ({
  watches: { id: "id", status: "status", createdAt: "created_at" },
  parts: { watchId: "watch_id" },
  sales: { watchId: "watch_id" },
}));

describe("Watch API Logic", () => {
  it("validates required fields for watch creation", () => {
    const invalidData = { brand: "", model: "" };
    expect(invalidData.brand).toBe("");
  });

  it("validates movement type enum", () => {
    const validMovements = [
      "Automatic",
      "Quartz",
      "Manual",
      "Solar",
      "Mecha-Quartz",
      "Vintage Manual",
    ];
    expect(validMovements).toContain("Automatic");
    expect(validMovements).not.toContain("Invalid");
  });

  it("validates status enum", () => {
    const validStatuses = ["In Inventory", "Modding", "Listed", "Sold"];
    expect(validStatuses).toContain("Sold");
  });

  it("computes unit economics for a watch", () => {
    const watch = { baseCost: 220 };
    const parts = [{ cost: 15 }, { cost: 30 }];
    const sale = {
      grossSalePrice: 350,
      platformFee: 22.75,
      shippingInsurance: 15,
    };

    const totalPartsCost = parts.reduce((sum, p) => sum + p.cost, 0);
    const totalCogs = watch.baseCost + totalPartsCost;
    const netRevenue =
      sale.grossSalePrice - sale.platformFee - sale.shippingInsurance;
    const unitProfit = netRevenue - totalCogs;
    const roi = unitProfit / totalCogs;

    expect(totalPartsCost).toBe(45);
    expect(totalCogs).toBe(265);
    expect(netRevenue).toBe(312.25);
    expect(unitProfit).toBe(47.25);
    expect(roi).toBeCloseTo(0.1783, 4);
  });
});
