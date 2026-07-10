import { db } from "../db";
import { parts, watches } from "../db/schema";
import { eq, desc, and, sql, or } from "drizzle-orm";
import { paginatedResult, type PaginatedResult } from "./pagination";

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

export async function getPaginatedParts(params: {
  page: number;
  pageSize: number;
  search?: string;
  category?: string;
  watchId?: number;
}): Promise<PaginatedResult<any>> {
  const { page, pageSize, search, category, watchId } = params;
  const conditions: any[] = [];

  if (category) {
    conditions.push(eq(parts.category, category));
  }
  if (watchId) {
    conditions.push(eq(parts.watchId, watchId));
  }
  if (search) {
    const term = `%${search.toLowerCase()}%`;
    conditions.push(sql`LOWER(${parts.description}) LIKE ${term}`);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(parts)
    .leftJoin(watches, eq(parts.watchId, watches.id))
    .where(where);

  const total = Number(countResult.count);

  const data = await db
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
    .orderBy(desc(parts.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return paginatedResult(data, total, page, pageSize);
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
