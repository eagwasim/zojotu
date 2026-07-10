import { db } from "../db";
import { expenses } from "../db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { paginatedResult, type PaginatedResult } from "./pagination";

export async function getAllExpenses() {
  return db.select().from(expenses).orderBy(desc(expenses.createdAt));
}

export async function getPaginatedExpenses(params: {
  page: number;
  pageSize: number;
  search?: string;
  category?: string;
}): Promise<PaginatedResult<any>> {
  const { page, pageSize, search, category } = params;
  const conditions: any[] = [];

  if (category) {
    conditions.push(eq(expenses.category, category));
  }
  if (search) {
    const term = `%${search.toLowerCase()}%`;
    conditions.push(sql`LOWER(${expenses.description}) LIKE ${term}`);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(expenses)
    .where(where);

  const total = Number(countResult.count);

  const data = await db
    .select()
    .from(expenses)
    .where(where)
    .orderBy(desc(expenses.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return paginatedResult(data, total, page, pageSize);
}

export async function getExpenseById(id: number) {
  const [expense] = await db
    .select()
    .from(expenses)
    .where(eq(expenses.id, id))
    .limit(1);
  return expense || null;
}

export async function createExpense(data: {
  date: string;
  category: string;
  description: string;
  amount: number;
}) {
  const [expense] = await db.insert(expenses).values(data).returning();
  return expense;
}

export async function updateExpense(
  id: number,
  data: Partial<{
    date: string;
    category: string;
    description: string;
    amount: number;
  }>
) {
  const [expense] = await db
    .update(expenses)
    .set(data)
    .where(eq(expenses.id, id))
    .returning();
  return expense;
}

export async function deleteExpense(id: number) {
  await db.delete(expenses).where(eq(expenses.id, id));
}
