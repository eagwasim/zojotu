import { db } from "../db";
import { serviceCatalog } from "../db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { paginatedResult, type PaginatedResult } from "./pagination";

export async function getAllCatalogItems() {
  return db.select().from(serviceCatalog).orderBy(desc(serviceCatalog.createdAt));
}

export async function getActiveCatalogItems() {
  return db
    .select()
    .from(serviceCatalog)
    .where(eq(serviceCatalog.active, 1))
    .orderBy(serviceCatalog.category, serviceCatalog.name);
}

export async function getCatalogItemById(id: number) {
  const [item] = await db
    .select()
    .from(serviceCatalog)
    .where(eq(serviceCatalog.id, id))
    .limit(1);
  return item || null;
}

export async function getPaginatedCatalogItems(params: {
  page: number;
  pageSize: number;
  search?: string;
  category?: string;
}): Promise<PaginatedResult<any>> {
  const { page, pageSize, search, category } = params;
  const conditions: any[] = [];

  if (category) {
    conditions.push(eq(serviceCatalog.category, category));
  }
  if (search) {
    const term = `%${search.toLowerCase()}%`;
    conditions.push(sql`LOWER(${serviceCatalog.name}) LIKE ${term}`);
  }

  const { and } = await import("drizzle-orm");
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(serviceCatalog)
    .where(where);

  const total = Number(countResult.count);

  const data = await db
    .select()
    .from(serviceCatalog)
    .where(where)
    .orderBy(desc(serviceCatalog.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return paginatedResult(data, total, page, pageSize);
}

export async function createCatalogItem(data: {
  name: string;
  description?: string;
  estimatedPrice: number;
  category: string;
  active?: number;
}) {
  const [item] = await db.insert(serviceCatalog).values(data).returning();
  return item;
}

export async function updateCatalogItem(
  id: number,
  data: Partial<{
    name: string;
    description: string;
    estimatedPrice: number;
    category: string;
    active: number;
  }>
) {
  const [item] = await db
    .update(serviceCatalog)
    .set(data)
    .where(eq(serviceCatalog.id, id))
    .returning();
  return item;
}

export async function deleteCatalogItem(id: number) {
  await db.delete(serviceCatalog).where(eq(serviceCatalog.id, id));
}
