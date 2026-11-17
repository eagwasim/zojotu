import { db } from "../db";
import { sales, watches } from "../db/schema";
import { eq, desc, asc, and, sql, type SQL } from "drizzle-orm";
import { paginatedResult, type SortDir } from "./pagination";
import { sumMoney, toCount, toMoney } from "./list-totals";
import { saleProfit } from "../profit";
import { dbNow } from "../db/now";

export async function getAllSales() {
  return db.select().from(sales).orderBy(desc(sales.createdAt));
}

export const SALE_SORTS = ["date", "price", "profit", "platform", "watch"] as const;
export type SaleSort = (typeof SALE_SORTS)[number];

export interface SaleTotals {
  count: number;
  /** Sum of gross sale prices. */
  revenue: number;
  /** Platform fees plus shipping & insurance. */
  fees: number;
  /** Same rule as src/lib/profit.ts: price − fees − (purchase cost + parts). */
  profit: number;
}

/*
 * Parts total for the sale's watch. Written with explicit, table-qualified identifiers
 * because Drizzle renders interpolated columns unqualified inside a raw subquery.
 */
const partsCostSql = sql<number>`COALESCE((SELECT SUM(p.cost) FROM parts p WHERE p.watch_id = ${sql.raw('"sales"."watch_id"')}), 0)`;
const costBasisSql = sql<number>`(COALESCE(${watches.baseCost}, 0) + ${partsCostSql})`;
/** Per-sale profit, for ordering and the totals. Row values are recomputed in JS with saleProfit. */
const profitSql = sql<number>`(${sales.grossSalePrice} - ${sales.platformFee} - ${sales.shippingInsurance} - ${costBasisSql})`;

function saleOrder(sort: { key: SaleSort; dir: SortDir } | null) {
  if (!sort) return [desc(sales.saleDate), desc(sales.id)];
  const by = sort.dir === "desc" ? desc : asc;
  switch (sort.key) {
    case "date":
      return [by(sales.saleDate), by(sales.id)];
    case "price":
      return [by(sales.grossSalePrice), desc(sales.saleDate), desc(sales.id)];
    case "profit":
      return [by(profitSql), desc(sales.saleDate), desc(sales.id)];
    case "platform":
      return [by(sql`LOWER(${sales.platform})`), desc(sales.saleDate), desc(sales.id)];
    case "watch":
      return [by(sql`LOWER(${watches.brand})`), by(sql`LOWER(${watches.model})`), desc(sales.saleDate), desc(sales.id)];
  }
}

export async function getPaginatedSales(params: {
  page: number;
  pageSize: number;
  search?: string;
  platform?: string;
  sort?: { key: SaleSort; dir: SortDir } | null;
}) {
  const { page, pageSize, search, platform, sort = null } = params;
  const conditions: SQL[] = [];

  if (platform) {
    conditions.push(eq(sales.platform, platform));
  }
  if (search) {
    const term = `%${search.toLowerCase()}%`;
    // Brand and model together, so "seiko skx" matches.
    conditions.push(sql`LOWER(${watches.brand} || ' ' || ${watches.model}) LIKE ${term}`);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [agg] = await db
    .select({
      count: sql<number>`COUNT(*)`,
      revenue: sumMoney(sales.grossSalePrice),
      fees: sql<number>`${sumMoney(sales.platformFee)} + ${sumMoney(sales.shippingInsurance)}`,
      profit: sumMoney(profitSql),
    })
    .from(sales)
    .leftJoin(watches, eq(sales.watchId, watches.id))
    .where(where);

  const totals: SaleTotals = {
    count: toCount(agg?.count),
    revenue: toMoney(agg?.revenue),
    fees: toMoney(agg?.fees),
    profit: toMoney(agg?.profit),
  };

  const rows: (SaleListRow & { costBasis: unknown })[] = await db
    .select({
      id: sales.id,
      watchId: sales.watchId,
      saleDate: sales.saleDate,
      platform: sales.platform,
      grossSalePrice: sales.grossSalePrice,
      platformFee: sales.platformFee,
      shippingInsurance: sales.shippingInsurance,
      notes: sales.notes,
      createdAt: sales.createdAt,
      watchBrand: watches.brand,
      watchModel: watches.model,
      costBasis: costBasisSql,
    })
    .from(sales)
    .leftJoin(watches, eq(sales.watchId, watches.id))
    .where(where)
    .orderBy(...saleOrder(sort))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const data = rows.map((r) => {
    const costBasis = Number(r.costBasis) || 0;
    return { ...r, costBasis, profit: saleProfit(r, costBasis) };
  });

  return { ...paginatedResult(data, totals.count, page, pageSize), totals };
}

interface SaleListRow {
  id: number;
  watchId: number;
  saleDate: string;
  platform: string;
  grossSalePrice: number;
  platformFee: number;
  shippingInsurance: number;
  notes: string | null;
  createdAt: string | null;
  watchBrand: string | null;
  watchModel: string | null;
}

export async function getSaleById(id: number) {
  const [sale] = await db.select().from(sales).where(eq(sales.id, id)).limit(1);
  return sale || null;
}

export async function createSale(data: {
  watchId: number;
  saleDate: string;
  platform: string;
  grossSalePrice: number;
  platformFee?: number;
  shippingInsurance?: number;
  notes?: string;
}) {
  const [sale] = await db.insert(sales).values(data).returning();

  await db
    .update(watches)
    .set({ status: "Sold", updatedAt: dbNow()})
    .where(eq(watches.id, data.watchId));

  return sale;
}

export async function updateSale(
  id: number,
  data: Partial<{
    watchId: number;
    saleDate: string;
    platform: string;
    grossSalePrice: number;
    platformFee: number;
    shippingInsurance: number;
    notes: string;
  }>
) {
  const [sale] = await db
    .update(sales)
    .set(data)
    .where(eq(sales.id, id))
    .returning();
  return sale;
}

export async function deleteSale(id: number) {
  const sale = await getSaleById(id);
  if (sale) {
    await db.delete(sales).where(eq(sales.id, id));
    await db
      .update(watches)
      .set({ status: "Listed", updatedAt: dbNow() })
      .where(eq(watches.id, sale.watchId));
  }
}
