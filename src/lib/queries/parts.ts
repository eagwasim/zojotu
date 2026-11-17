import { db } from "../db";
import { parts, watches } from "../db/schema";
import { eq, desc, asc, and, sql, or, type SQL } from "drizzle-orm";
import { paginatedResult, type SortDir } from "./pagination";
import { sumMoney, toCount, toMoney } from "./list-totals";

export async function getAllParts(watchId?: number) {
  if (watchId) {
    return db
      .select()
      .from(parts)
      .where(eq(parts.watchId, watchId))
      .orderBy(desc(parts.createdAt));
  }
  return db.select().from(parts).orderBy(desc(parts.createdAt));
}

export const PART_SORTS = ["date", "cost", "category", "watch", "supplier"] as const;
export type PartSort = (typeof PART_SORTS)[number];

export interface PartListRow {
  id: number;
  watchId: number;
  date: string;
  description: string;
  category: string;
  cost: number;
  supplier: string | null;
  createdAt: string | null;
  watchBrand: string | null;
  watchModel: string | null;
}

export interface PartTotals {
  count: number;
  cost: number;
}

function partOrder(sort: { key: PartSort; dir: SortDir } | null) {
  if (!sort) return [desc(parts.date), desc(parts.id)];
  const by = sort.dir === "desc" ? desc : asc;
  switch (sort.key) {
    case "date":
      return [by(parts.date), by(parts.id)];
    case "cost":
      return [by(parts.cost), desc(parts.date), desc(parts.id)];
    case "category":
      return [by(sql`LOWER(${parts.category})`), desc(parts.date), desc(parts.id)];
    case "watch":
      return [by(sql`LOWER(${watches.brand})`), by(sql`LOWER(${watches.model})`), desc(parts.date), desc(parts.id)];
    // Parts without a supplier always sort last, whichever the direction.
    case "supplier":
      return [
        asc(sql`CASE WHEN ${parts.supplier} IS NULL OR ${parts.supplier} = '' THEN 1 ELSE 0 END`),
        by(sql`LOWER(${parts.supplier})`),
        desc(parts.date),
        desc(parts.id),
      ];
  }
}

export async function getPaginatedParts(params: {
  page: number;
  pageSize: number;
  search?: string;
  category?: string;
  watchId?: number;
  sort?: { key: PartSort; dir: SortDir } | null;
}) {
  const { page, pageSize, search, category, watchId, sort = null } = params;
  const conditions: SQL[] = [];

  if (category) {
    conditions.push(eq(parts.category, category));
  }
  if (watchId) {
    conditions.push(eq(parts.watchId, watchId));
  }
  if (search) {
    const term = `%${search.toLowerCase()}%`;
    conditions.push(
      or(
        sql`LOWER(${parts.description}) LIKE ${term}`,
        sql`LOWER(COALESCE(${parts.supplier}, '')) LIKE ${term}`,
        sql`LOWER(${watches.brand} || ' ' || ${watches.model}) LIKE ${term}`
      )!
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [agg] = await db
    .select({ count: sql<number>`COUNT(*)`, cost: sumMoney(parts.cost) })
    .from(parts)
    .leftJoin(watches, eq(parts.watchId, watches.id))
    .where(where);

  const totals: PartTotals = { count: toCount(agg?.count), cost: toMoney(agg?.cost) };

  const data: PartListRow[] = await db
    .select({
      id: parts.id,
      watchId: parts.watchId,
      date: parts.date,
      description: parts.description,
      category: parts.category,
      cost: parts.cost,
      supplier: parts.supplier,
      createdAt: parts.createdAt,
      watchBrand: watches.brand,
      watchModel: watches.model,
    })
    .from(parts)
    .leftJoin(watches, eq(parts.watchId, watches.id))
    .where(where)
    .orderBy(...partOrder(sort))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return { ...paginatedResult(data, totals.count, page, pageSize), totals };
}

export async function getPartById(id: number) {
  const [part] = await db.select().from(parts).where(eq(parts.id, id)).limit(1);
  return part || null;
}

export async function createPart(data: {
  watchId: number;
  date: string;
  description: string;
  category: string;
  cost: number;
  supplier?: string;
}) {
  const [part] = await db.insert(parts).values(data).returning();
  return part;
}

export async function updatePart(
  id: number,
  data: Partial<{
    watchId: number;
    date: string;
    description: string;
    category: string;
    cost: number;
    supplier: string;
  }>
) {
  const [part] = await db
    .update(parts)
    .set(data)
    .where(eq(parts.id, id))
    .returning();
  return part;
}

export async function deletePart(id: number) {
  await db.delete(parts).where(eq(parts.id, id));
}
