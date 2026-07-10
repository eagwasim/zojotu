import { db } from "../db";
import { sales, watches } from "../db/schema";
import { eq, desc, and, or, sql } from "drizzle-orm";
import { paginatedResult, type PaginatedResult } from "./pagination";

export async function getAllSales() {
  return db.select().from(sales).orderBy(desc(sales.createdAt));
}

export async function getPaginatedSales(params: {
  page: number;
  pageSize: number;
  search?: string;
  platform?: string;
}): Promise<PaginatedResult<any>> {
  const { page, pageSize, search, platform } = params;
  const conditions: any[] = [];

  if (platform) {
    conditions.push(eq(sales.platform, platform));
  }
  if (search) {
    const term = `%${search.toLowerCase()}%`;
    conditions.push(
      or(
        sql`LOWER(${watches.brand}) LIKE ${term}`,
        sql`LOWER(${watches.model}) LIKE ${term}`
      )
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(sales)
    .leftJoin(watches, eq(sales.watchId, watches.id))
    .where(where);

  const total = Number(countResult.count);

  const data = await db
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
    })
    .from(sales)
    .leftJoin(watches, eq(sales.watchId, watches.id))
    .where(where)
    .orderBy(desc(sales.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return paginatedResult(data, total, page, pageSize);
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
    .set({ status: "Sold", updatedAt: new Date().toISOString() })
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
      .set({ status: "Listed", updatedAt: new Date().toISOString() })
      .where(eq(watches.id, sale.watchId));
  }
}
