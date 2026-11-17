import { db } from "../db";
import { watches, parts, sales } from "../db/schema";
import { eq, sql, desc, and, or, ne, inArray, asc } from "drizzle-orm";
import { watchImages } from "../db/schema";
import type { WatchInput, WatchUpdate, SETTABLE_STATUSES } from "../validators/watch";
import { paginatedResult, type PaginatedResult } from "./pagination";
import { saleNetRevenue, saleProfit } from "../profit";
import { dbNow } from "../db/now";

type SettableStatus = (typeof SETTABLE_STATUSES)[number];

function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Moving to "Listed" stamps the listed date, but never overwrites one that is already set. */
const keepOrStampListedDate = () => sql`coalesce(${watches.listedDate}, ${today()})`;

function withListingDefaults<T extends WatchUpdate>(data: T) {
  if (data.status === "Listed" && data.listedDate === undefined) {
    return { ...data, listedDate: keepOrStampListedDate() };
  }
  return data;
}

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
  const netRevenue = sale ? saleNetRevenue(sale) : 0;
  const unitNetProfit = sale ? saleProfit(sale, totalCogs) : 0;
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

  const images = await db
    .select()
    .from(watchImages)
    .where(eq(watchImages.watchId, id))
    .orderBy(asc(watchImages.sortOrder), asc(watchImages.id));

  return {
    ...watch,
    parts: watchParts,
    sale: sale || null,
    images,
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

export async function createWatch(data: WatchInput) {
  const values =
    data.status === "Listed" && !data.listedDate ? { ...data, listedDate: today() } : data;
  const [watch] = await db.insert(watches).values(values).returning();
  return watch;
}

export async function updateWatch(id: number, data: WatchUpdate) {
  const [watch] = await db
    .update(watches)
    .set({ ...withListingDefaults(data), updatedAt: dbNow() })
    .where(eq(watches.id, id))
    .returning();
  return watch;
}

/** Change status for many watches at once. Never used for "Sold" (that comes from a sale). */
export async function bulkUpdateStatus(ids: number[], status: SettableStatus) {
  const listing = status === "Listed" ? { listedDate: keepOrStampListedDate() } : {};
  const updated = await db
    .update(watches)
    .set({ status, ...listing, updatedAt: dbNow() })
    .where(and(inArray(watches.id, ids), ne(watches.status, "Sold")))
    .returning({ id: watches.id });
  return updated.map((r: { id: number }) => r.id);
}

export async function deleteWatch(id: number) {
  await db.delete(watches).where(eq(watches.id, id));
}
