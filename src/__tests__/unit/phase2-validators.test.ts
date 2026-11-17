import { describe, it, expect } from "vitest";
import { bulkStatusSchema, watchSchema, watchUpdateSchema } from "@/lib/validators/watch";
import { saleSchema, saleUpdateSchema } from "@/lib/validators/sale";
import { partSchema } from "@/lib/validators/part";
import { estimateFee, feeRateFor, parsePlatformFees, platformFeesSchema } from "@/lib/platform-fees";

const validWatch = {
  brand: "Seiko",
  model: "SKX007",
  movementType: "Automatic",
  acquisitionDate: "2026-11-01",
  source: "eBay",
  baseCost: 120,
  status: "In Inventory",
};

describe("watch validation", () => {
  it("accepts the new listing fields", () => {
    const r = watchSchema.safeParse({
      ...validWatch,
      status: "Listed",
      askingPrice: 250,
      listedDate: "2026-11-10",
      listedPlatform: "eBay",
      condition: "Very good",
      serial: "123456",
    });
    expect(r.success).toBe(true);
  });

  it("turns empty optional text into null so it can be cleared", () => {
    const r = watchSchema.parse({ ...validWatch, reference: "  ", notes: "" });
    expect(r.reference).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("rejects a malformed date", () => {
    expect(watchSchema.safeParse({ ...validWatch, acquisitionDate: "yesterday" }).success).toBe(false);
  });

  it("partial update only carries the fields sent", () => {
    // Guards against wiping notes/reference when only the status changes.
    expect(watchUpdateSchema.parse({ status: "Listed" })).toEqual({ status: "Listed" });
  });

  it("partial update drops unknown keys", () => {
    expect(watchUpdateSchema.parse({ status: "Modding", id: 99, createdAt: "x" })).toEqual({ status: "Modding" });
  });

  it("bulk status never allows Sold", () => {
    expect(bulkStatusSchema.safeParse({ ids: [1, 2], status: "Sold" }).success).toBe(false);
    expect(bulkStatusSchema.safeParse({ ids: [1, 2], status: "Listed" }).success).toBe(true);
    expect(bulkStatusSchema.safeParse({ ids: [], status: "Listed" }).success).toBe(false);
  });
});

describe("sale validation", () => {
  it("defaults fees to 0 when creating", () => {
    const r = saleSchema.parse({ watchId: 1, saleDate: "2026-11-10", platform: "eBay", grossSalePrice: 300 });
    expect(r.platformFee).toBe(0);
    expect(r.shippingInsurance).toBe(0);
  });

  it("does not inject fee defaults into a partial update", () => {
    // `.partial()` keeps `.default(0)`; that would zero a saved fee on any edit.
    expect(saleUpdateSchema.parse({ notes: "tracking 123" })).toEqual({ notes: "tracking 123" });
  });

  it("rejects a zero sale price", () => {
    expect(
      saleSchema.safeParse({ watchId: 1, saleDate: "2026-11-10", platform: "eBay", grossSalePrice: 0 }).success
    ).toBe(false);
  });
});

describe("part validation", () => {
  it("requires a description and a known category", () => {
    const base = { watchId: 1, date: "2026-11-01", description: "Crystal", category: "Glass", cost: 20 };
    expect(partSchema.safeParse(base).success).toBe(true);
    expect(partSchema.safeParse({ ...base, description: "  " }).success).toBe(false);
    expect(partSchema.safeParse({ ...base, category: "Sticker" }).success).toBe(false);
  });
});

describe("platform fees", () => {
  it("parses stored JSON and ignores garbage", () => {
    expect(parsePlatformFees('{"eBay":0.13}')).toEqual({ eBay: 0.13 });
    expect(parsePlatformFees("not json")).toEqual({});
    expect(parsePlatformFees('{"eBay":13}')).toEqual({}); // must be a fraction
    expect(parsePlatformFees(null)).toEqual({});
  });

  it("looks up rates case-insensitively", () => {
    const fees = { eBay: 0.13, Chrono24: 0.065 };
    expect(feeRateFor(fees, "ebay")).toBe(0.13);
    expect(feeRateFor(fees, " Chrono24 ")).toBe(0.065);
    expect(feeRateFor(fees, "Vinted")).toBeNull();
    expect(feeRateFor(fees, "")).toBeNull();
  });

  it("rounds estimated fees to cents", () => {
    expect(estimateFee(333.33, 0.13)).toBe(43.33);
    expect(estimateFee(0, 0.13)).toBe(0);
  });

  it("rejects percentages entered as whole numbers", () => {
    expect(platformFeesSchema.safeParse({ eBay: 13 }).success).toBe(false);
    expect(platformFeesSchema.safeParse({ eBay: 0.13 }).success).toBe(true);
  });
});
