// @vitest-environment node
import { describe, it, expect, vi, beforeAll } from "vitest";
import { toCategoryAmounts, toCount, toMoney } from "@/lib/queries/list-totals";
import { parseSort } from "@/lib/queries/pagination";

/*
 * The list queries run against a real in-memory SQLite database (same schema as the app's
 * SQLite driver), so the ORDER BY expressions and totals are exercised as SQL, not mocks.
 */
vi.mock("@/lib/db/schema", async () => import("@/lib/db/schema-sqlite"));
vi.mock("@/lib/db", async () => {
  const Database = (await import("better-sqlite3")).default;
  const { drizzle } = await import("drizzle-orm/better-sqlite3");
  const schema = await import("@/lib/db/schema-sqlite");
  const sqlite = new Database(":memory:");
  sqlite.exec(`
    CREATE TABLE watches (id INTEGER PRIMARY KEY AUTOINCREMENT, brand TEXT NOT NULL, model TEXT NOT NULL,
      reference TEXT, movement_type TEXT NOT NULL, acquisition_date TEXT NOT NULL, source TEXT NOT NULL,
      base_cost REAL NOT NULL, status TEXT NOT NULL DEFAULT 'In Inventory', notes TEXT, asking_price REAL,
      listed_date TEXT, listed_platform TEXT, serial TEXT, condition TEXT, primary_image_id INTEGER,
      created_at TEXT, updated_at TEXT);
    CREATE TABLE parts (id INTEGER PRIMARY KEY AUTOINCREMENT, watch_id INTEGER NOT NULL, date TEXT NOT NULL,
      description TEXT NOT NULL, category TEXT NOT NULL, cost REAL NOT NULL, supplier TEXT, created_at TEXT);
    CREATE TABLE sales (id INTEGER PRIMARY KEY AUTOINCREMENT, watch_id INTEGER NOT NULL, sale_date TEXT NOT NULL,
      platform TEXT NOT NULL, gross_sale_price REAL NOT NULL, platform_fee REAL NOT NULL DEFAULT 0,
      shipping_insurance REAL NOT NULL DEFAULT 0, notes TEXT, created_at TEXT);
    CREATE TABLE expenses (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, category TEXT NOT NULL,
      description TEXT NOT NULL, amount REAL NOT NULL, created_at TEXT);

    INSERT INTO watches (id, brand, model, movement_type, acquisition_date, source, base_cost, status) VALUES
      (1, 'Seiko', 'SKX007', 'Automatic', '2026-01-01', 'eBay', 200, 'Sold'),
      (2, 'Orient', 'Bambino', 'Automatic', '2026-01-01', 'eBay', 100, 'Sold'),
      (3, 'Tudor', 'Black Bay', 'Automatic', '2026-01-01', 'eBay', 1500, 'Sold');
    INSERT INTO parts (watch_id, date, description, category, cost, supplier) VALUES
      (1, '2026-02-01', 'Sapphire crystal', 'Glass', 30.10, 'Crystaltimes'),
      (1, '2026-02-03', 'Bezel insert', 'Bezel', 20.20, NULL),
      (2, '2026-02-02', 'Leather strap', 'Strap', 15.05, 'aliexpress');
    INSERT INTO sales (watch_id, sale_date, platform, gross_sale_price, platform_fee, shipping_insurance) VALUES
      (1, '2026-03-01', 'eBay', 400, 40, 10),
      (2, '2026-03-05', 'Chrono24', 150.50, 9.75, 12),
      (3, '2026-02-20', 'Private Sale', 1400, 0, 0);
    INSERT INTO expenses (date, category, description, amount) VALUES
      ('2026-01-05', 'Tools', 'Case press', 85.10),
      ('2026-02-05', 'Supplies', 'Movement oil', 40.20),
      ('2026-03-05', 'Tools', 'Spring bar tool', 12.30);
  `);
  return { db: drizzle(sqlite, { schema }), dbDriver: "sqlite" };
});

let q: {
  sales: typeof import("@/lib/queries/sales");
  parts: typeof import("@/lib/queries/parts");
  expenses: typeof import("@/lib/queries/expenses");
};
beforeAll(async () => {
  q = {
    sales: await import("@/lib/queries/sales"),
    parts: await import("@/lib/queries/parts"),
    expenses: await import("@/lib/queries/expenses"),
  };
});

describe("list totals helpers", () => {
  it("rounds money to cents and tolerates strings and nulls", () => {
    expect(toMoney(0.1 + 0.2)).toBe(0.3);
    expect(toMoney("12.345")).toBe(12.35);
    expect(toMoney(null)).toBe(0);
    expect(toMoney("abc")).toBe(0);
    expect(Object.is(toMoney(-0.001), 0)).toBe(true);
  });
  it("reads counts from bigint strings", () => {
    expect(toCount("42")).toBe(42);
    expect(toCount(undefined)).toBe(0);
  });
  it("orders categories largest first, then by name", () => {
    expect(
      toCategoryAmounts([
        { category: "B", amount: "10" },
        { category: "C", amount: 30 },
        { category: "A", amount: 10 },
      ])
    ).toEqual([
      { category: "C", amount: 30 },
      { category: "A", amount: 10 },
      { category: "B", amount: 10 },
    ]);
  });
  it("whitelists sort keys", () => {
    const allowed = ["date", "price"] as const;
    expect(parseSort(new URLSearchParams("sort=price&dir=desc"), allowed)).toEqual({ key: "price", dir: "desc" });
    expect(parseSort(new URLSearchParams("sort=id;drop"), allowed)).toBeNull();
  });
});

describe("getPaginatedSales", () => {
  // Profits: SKX 400-50-(200+50.30)=99.70; Bambino 150.50-21.75-(100+15.05)=13.70; Tudor 1400-0-1500=-100
  it("defaults to newest sale first", async () => {
    const r = await q.sales.getPaginatedSales({ page: 1, pageSize: 10 });
    expect(r.data.map((s) => s.watchId)).toEqual([2, 1, 3]);
  });

  it("sorts by profit in SQL and paginates the sorted set", async () => {
    const p1 = await q.sales.getPaginatedSales({ page: 1, pageSize: 2, sort: { key: "profit", dir: "desc" } });
    const p2 = await q.sales.getPaginatedSales({ page: 2, pageSize: 2, sort: { key: "profit", dir: "desc" } });
    expect(p1.data.map((s) => s.watchId)).toEqual([1, 2]);
    expect(p2.data.map((s) => s.watchId)).toEqual([3]);
    expect(p1.data[0].profit).toBeCloseTo(99.7, 6);
    expect(p2.data[0].profit).toBe(-100);
    expect(p1.totalPages).toBe(2);
  });

  it("returns totals for the whole filtered set, not the page", async () => {
    const r = await q.sales.getPaginatedSales({ page: 1, pageSize: 1 });
    expect(r.totals).toEqual({ count: 3, revenue: 1950.5, fees: 71.75, profit: 13.4 });
    const filtered = await q.sales.getPaginatedSales({ page: 1, pageSize: 1, search: "seiko skx" });
    expect(filtered.totals).toEqual({ count: 1, revenue: 400, fees: 50, profit: 99.7 });
  });

  it("sorts by watch name and platform", async () => {
    const byWatch = await q.sales.getPaginatedSales({ page: 1, pageSize: 10, sort: { key: "watch", dir: "asc" } });
    expect(byWatch.data.map((s) => s.watchBrand)).toEqual(["Orient", "Seiko", "Tudor"]);
    const byPlatform = await q.sales.getPaginatedSales({ page: 1, pageSize: 10, sort: { key: "platform", dir: "desc" } });
    expect(byPlatform.data.map((s) => s.platform)).toEqual(["Private Sale", "eBay", "Chrono24"]);
  });
});

describe("getPaginatedParts", () => {
  it("sorts suppliers case-insensitively with blanks last in both directions", async () => {
    const asc = await q.parts.getPaginatedParts({ page: 1, pageSize: 10, sort: { key: "supplier", dir: "asc" } });
    const desc = await q.parts.getPaginatedParts({ page: 1, pageSize: 10, sort: { key: "supplier", dir: "desc" } });
    expect(asc.data.map((p) => p.supplier)).toEqual(["aliexpress", "Crystaltimes", null]);
    expect(desc.data.map((p) => p.supplier)).toEqual(["Crystaltimes", "aliexpress", null]);
  });

  it("totals the filtered set and searches by watch", async () => {
    const r = await q.parts.getPaginatedParts({ page: 1, pageSize: 1, search: "seiko" });
    expect(r.totals).toEqual({ count: 2, cost: 50.3 });
    expect(r.total).toBe(2);
    const all = await q.parts.getPaginatedParts({ page: 1, pageSize: 1, sort: { key: "cost", dir: "asc" } });
    expect(all.totals).toEqual({ count: 3, cost: 65.35 });
    expect(all.data[0].cost).toBeCloseTo(15.05, 6);
  });
});

describe("getPaginatedExpenses", () => {
  it("totals by category over the filtered set", async () => {
    const r = await q.expenses.getPaginatedExpenses({ page: 1, pageSize: 1 });
    expect(r.totals).toEqual({
      count: 3,
      amount: 137.6,
      byCategory: [
        { category: "Tools", amount: 97.4 },
        { category: "Supplies", amount: 40.2 },
      ],
    });
    const tools = await q.expenses.getPaginatedExpenses({ page: 1, pageSize: 10, category: "Tools" });
    expect(tools.totals.count).toBe(2);
    expect(tools.totals.byCategory).toEqual([{ category: "Tools", amount: 97.4 }]);
  });

  it("sorts by amount and defaults to newest first", async () => {
    const byAmount = await q.expenses.getPaginatedExpenses({ page: 1, pageSize: 10, sort: { key: "amount", dir: "desc" } });
    expect(byAmount.data.map((e) => e.amount)).toEqual([85.1, 40.2, 12.3]);
    const byDefault = await q.expenses.getPaginatedExpenses({ page: 1, pageSize: 10 });
    expect(byDefault.data.map((e) => e.date)).toEqual(["2026-03-05", "2026-02-05", "2026-01-05"]);
  });
});
