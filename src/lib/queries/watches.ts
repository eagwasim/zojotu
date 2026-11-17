import { db } from "../db";
import { watches, parts, sales } from "../db/schema";
import { eq, sql, desc, and, or, ne, inArray, asc } from "drizzle-orm";
import { watchImages } from "../db/schema";
import type { WatchInput, WatchUpdate, SETTABLE_STATUSES } from "../validators/watch";
import { paginatedResult } from "./pagination";
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

export const WATCH_SORTS = ["acquired", "cost", "asking", "brand", "listed"] as const;
export type WatchSort = (typeof WATCH_SORTS)[number];

/*
 * Correlated subqueries, written with explicit table-qualified identifiers: Drizzle renders
 * interpolated columns unqualified, which would make `id` resolve to the inner table.
 * Portable across Postgres and SQLite.
 */
/** Parts total per watch. */
const partsCostSql = sql<number>`coalesce((select sum(p.cost) from parts p where p.watch_id = ${sql.raw('"watches"."id"')}), 0)`;
/** Chosen cover photo, else the first uploaded one. */
const coverImageSql = sql<number | null>`coalesce(${sql.raw('"watches"."primary_image_id"')}, (select min(i.id) from watch_images i where i.watch_id = ${sql.raw('"watches"."id"')}))`;

function orderFor(sort: { key: WatchSort; dir: "asc" | "desc" } | null) {
  if (!sort) return [desc(watches.createdAt)];
  const by = sort.dir === "desc" ? desc : asc;
  switch (sort.key) {
    case "acquired":
      return [by(watches.acquisitionDate), desc(watches.id)];
    case "cost":
      return [by(sql`${watches.baseCost} + ${partsCostSql}`), desc(watches.id)];
    case "brand":
      return [by(sql`lower(${watches.brand})`), asc(sql`lower(${watches.model})`)];
    // Watches without a value always sort last, whichever the direction.
    case "asking":
      return [asc(sql`case when ${watches.askingPrice} is null then 1 else 0 end`), by(watches.askingPrice)];
    case "listed":
      return [asc(sql`case when ${watches.listedDate} is null then 1 else 0 end`), by(watches.listedDate)];
  }
}

export async function getPaginatedWatches(params: {
  page: number;
  pageSize: number;
  status?: string;
  search?: string;
  sort?: { key: WatchSort; dir: "asc" | "desc" } | null;
}) {
  const { page, pageSize, status, search, sort = null } = params;

  const searchCondition = search
    ? or(
        sql`LOWER(${watches.brand}) LIKE ${`%${search.toLowerCase()}%`}`,
        sql`LOWER(${watches.model}) LIKE ${`%${search.toLowerCase()}%`}`,
        sql`LOWER(coalesce(${watches.reference}, '')) LIKE ${`%${search.toLowerCase()}%`}`
      )
    : undefined;
  const where = and(...[searchCondition, status ? eq(watches.status, status) : undefined].filter(Boolean));

  const [countResult] = await db.select({ count: sql<number>`COUNT(*)` }).from(watches).where(where);
  const total = Number(countResult.count);

  const rows = await db
    .select({ watch: watches, partsCost: partsCostSql, coverImageId: coverImageSql })
    .from(watches)
    .where(where)
    .orderBy(...orderFor(sort))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const data = rows.map((r: { watch: typeof watches.$inferSelect; partsCost: number | string; coverImageId: number | string | null }) => {
    const partsCost = Number(r.partsCost) || 0;
    return {
      ...r.watch,
      partsCost,
      costBasis: r.watch.baseCost + partsCost,
      coverImageId: r.coverImageId === null ? null : Number(r.coverImageId),
    };
  });

  // Per-stage counts for the filter tabs: respect the search, ignore the stage filter.
  const grouped: { status: string; count: number | string }[] = await db
    .select({ status: watches.status, count: sql<number>`COUNT(*)` })
    .from(watches)
    .where(searchCondition)
    .groupBy(watches.status);
  const counts: Record<string, number> = { all: 0 };
  for (const g of grouped) {
    counts[g.status] = Number(g.count);
    counts.all += Number(g.count);
  }

  return { ...paginatedResult(data, total, page, pageSize), counts };
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
