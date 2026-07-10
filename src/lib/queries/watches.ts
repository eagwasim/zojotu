import { db } from "../db";
import { watches, parts, sales } from "../db/schema";
import { eq, sql, desc, and, or } from "drizzle-orm";
import { paginatedResult, type PaginatedResult } from "./pagination";

export async function getAllWatches(status?: string) {
  const query = db.select().from(watches).orderBy(desc(watches.createdAt));
  if (status) {
    return query.where(eq(watches.status, status));
  }
  return query;
}

export async function getPaginatedWatches(params: {
  page: number;
  pageSize: number;
  status?: string;
  search?: string;
}): Promise<PaginatedResult<any>> {
  const { page, pageSize, status, search } = params;
  const conditions: any[] = [];

  if (status) {
    conditions.push(eq(watches.status, status));
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
    .from(watches)
    .where(where);

  const total = Number(countResult.count);

  const data = await db
    .select()
    .from(watches)
    .where(where)
    .orderBy(desc(watches.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return paginatedResult(data, total, page, pageSize);
}

export async function searchWatches(
  q: string,
  excludeStatus?: string,
  limit = 20
) {
  const conditions: any[] = [];
  if (q) {
    const term = `%${q.toLowerCase()}%`;
    conditions.push(
      or(
        sql`LOWER(${watches.brand}) LIKE ${term}`,
        sql`LOWER(${watches.model}) LIKE ${term}`
      )
    );
  }
  if (excludeStatus) {
    conditions.push(sql`${watches.status} != ${excludeStatus}`);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select({
      id: watches.id,
      brand: watches.brand,
      model: watches.model,
      status: watches.status,
    })
    .from(watches)
    .where(where)
    .orderBy(watches.brand, watches.model)
    .limit(limit);
}

export async function getWatchById(id: number) {
  const [watch] = await db
    .select()
    .from(watches)
    .where(eq(watches.id, id))
    .limit(1);
  return watch || null;
}

export async function getWatchWithEconomics(id: number) {
  const watch = await getWatchById(id);
  if (!watch) return null;

  const watchParts = await db
    .select()
    .from(parts)
    .where(eq(parts.watchId, id));

  const [sale] = await db
    .select()
    .from(sales)
    .where(eq(sales.watchId, id))
    .limit(1);

  const totalPartsCost = watchParts.reduce((sum: number, p: any) => sum + p.cost, 0);
  const totalCogs = watch.baseCost + totalPartsCost;
  const netRevenue = sale
    ? sale.grossSalePrice - sale.platformFee - sale.shippingInsurance
    : 0;
  const unitNetProfit = sale ? netRevenue - totalCogs : 0;
  const unitRoi = sale && totalCogs > 0 ? unitNetProfit / totalCogs : 0;

  let daysInInventory: number | null = null;
  if (sale) {
    const acqDate = new Date(watch.acquisitionDate);
    const saleDate = new Date(sale.saleDate);
    daysInInventory = Math.round(
      (saleDate.getTime() - acqDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  } else {
    const acqDate = new Date(watch.acquisitionDate);
    daysInInventory = Math.round(
      (Date.now() - acqDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  return {
    ...watch,
    parts: watchParts,
    sale: sale || null,
    economics: {
      baseCost: watch.baseCost,
      totalPartsCost,
      totalCogs,
      grossRevenue: sale?.grossSalePrice || 0,
      netRevenue,
      unitNetProfit,
      unitRoi,
      daysInInventory,
    },
  };
}

export async function createWatch(data: {
  brand: string;
  model: string;
  reference?: string;
  movementType: string;
  acquisitionDate: string;
  source: string;
  baseCost: number;
  status: string;
  notes?: string;
}) {
  const [watch] = await db.insert(watches).values(data).returning();
  return watch;
}

export async function updateWatch(
  id: number,
  data: Partial<{
    brand: string;
    model: string;
    reference: string;
    movementType: string;
    acquisitionDate: string;
    source: string;
    baseCost: number;
    status: string;
    notes: string;
  }>
) {
  const [watch] = await db
    .update(watches)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(watches.id, id))
    .returning();
  return watch;
}

export async function deleteWatch(id: number) {
  await db.delete(watches).where(eq(watches.id, id));
}
