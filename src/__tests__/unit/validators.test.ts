import { describe, it, expect } from "vitest";
import { watchSchema } from "@/lib/validators/watch";
import { partSchema } from "@/lib/validators/part";
import { saleSchema } from "@/lib/validators/sale";
import { expenseSchema } from "@/lib/validators/expense";

describe("watchSchema", () => {
  const validWatch = {
    brand: "Seiko",
    model: "SKX007",
    movementType: "Automatic" as const,
    acquisitionDate: "2026-06-20",
    source: "eBay",
    baseCost: 180,
    status: "In Inventory" as const,
  };

  it("accepts valid watch data", () => {
    const result = watchSchema.safeParse(validWatch);
    expect(result.success).toBe(true);
  });

  it("rejects empty brand", () => {
    const result = watchSchema.safeParse({ ...validWatch, brand: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid movement type", () => {
    const result = watchSchema.safeParse({
      ...validWatch,
      movementType: "Invalid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative cost", () => {
    const result = watchSchema.safeParse({ ...validWatch, baseCost: -10 });
    expect(result.success).toBe(false);
  });

  it("accepts optional notes", () => {
    const result = watchSchema.safeParse({
      ...validWatch,
      notes: "Test note",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional reference", () => {
    const result = watchSchema.safeParse({
      ...validWatch,
      reference: "REF-123",
    });
    expect(result.success).toBe(true);
  });
});

describe("partSchema", () => {
  const validPart = {
    watchId: 1,
    date: "2026-06-21",
    description: "Sapphire Crystal",
    category: "Glass" as const,
    cost: 45,
  };

  it("accepts valid part data", () => {
    const result = partSchema.safeParse(validPart);
    expect(result.success).toBe(true);
  });

  it("rejects missing watchId", () => {
    const { watchId, ...rest } = validPart;
    const result = partSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects invalid category", () => {
    const result = partSchema.safeParse({ ...validPart, category: "Invalid" });
    expect(result.success).toBe(false);
  });

  it("accepts optional supplier", () => {
    const result = partSchema.safeParse({
      ...validPart,
      supplier: "NamokiMods",
    });
    expect(result.success).toBe(true);
  });
});

describe("saleSchema", () => {
  const validSale = {
    watchId: 1,
    saleDate: "2026-06-25",
    platform: "Chrono24",
    grossSalePrice: 350,
    platformFee: 22.75,
    shippingInsurance: 15,
  };

  it("accepts valid sale data", () => {
    const result = saleSchema.safeParse(validSale);
    expect(result.success).toBe(true);
  });

  it("rejects zero sale price", () => {
    const result = saleSchema.safeParse({ ...validSale, grossSalePrice: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects negative fees", () => {
    const result = saleSchema.safeParse({ ...validSale, platformFee: -5 });
    expect(result.success).toBe(false);
  });

  it("accepts default fees when omitted", () => {
    const { platformFee, shippingInsurance, ...minimal } = validSale;
    const result = saleSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });
});

describe("expenseSchema", () => {
  const validExpense = {
    date: "2026-06-01",
    category: "Tools" as const,
    description: "Bergeon Spring Bar Tool",
    amount: 25,
  };

  it("accepts valid expense data", () => {
    const result = expenseSchema.safeParse(validExpense);
    expect(result.success).toBe(true);
  });

  it("rejects empty description", () => {
    const result = expenseSchema.safeParse({
      ...validExpense,
      description: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero amount", () => {
    const result = expenseSchema.safeParse({ ...validExpense, amount: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid category", () => {
    const result = expenseSchema.safeParse({
      ...validExpense,
      category: "Invalid",
    });
    expect(result.success).toBe(false);
  });
});
