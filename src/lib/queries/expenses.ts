import { db } from "../db";
import { expenses } from "../db/schema";
import { eq, desc, asc, and, sql, type SQL } from "drizzle-orm";
import { paginatedResult, type SortDir } from "./pagination";
import { sumMoney, toCategoryAmounts, toCount, toMoney, type CategoryAmount } from "./list-totals";

export async function getAllExpenses() {
  return db.select().from(expenses).orderBy(desc(expenses.createdAt));
}

export const EXPENSE_SORTS = ["date", "amount", "category"] as const;
export type ExpenseSort = (typeof EXPENSE_SORTS)[number];

export interface ExpenseRow {
  id: number;
  date: string;
  category: string;
  description: string;
  amount: number;
  createdAt: string | null;
}

export interface ExpenseTotals {
  count: number;
  amount: number;
  /** Largest first. */
  byCategory: CategoryAmount[];
}

function expenseOrder(sort: { key: ExpenseSort; dir: SortDir } | null) {
  if (!sort) return [desc(expenses.date), desc(expenses.id)];
  const by = sort.dir === "desc" ? desc : asc;
  switch (sort.key) {
    case "date":
      return [by(expenses.date), by(expenses.id)];
    case "amount":
      return [by(expenses.amount), desc(expenses.date), desc(expenses.id)];
    case "category":
      return [by(sql`LOWER(${expenses.category})`), desc(expenses.date), desc(expenses.id)];
  }
}

export async function getPaginatedExpenses(params: {
  page: number;
  pageSize: number;
  search?: string;
  category?: string;
  sort?: { key: ExpenseSort; dir: SortDir } | null;
}) {
  const { page, pageSize, search, category, sort = null } = params;
  const conditions: SQL[] = [];

  if (category) {
    conditions.push(eq(expenses.category, category));
  }
  if (search) {
    const term = `%${search.toLowerCase()}%`;
    conditions.push(sql`LOWER(${expenses.description}) LIKE ${term}`);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const grouped: { category: string; count: unknown; amount: unknown }[] = await db
    .select({
      category: expenses.category,
      count: sql<number>`COUNT(*)`,
      amount: sumMoney(expenses.amount),
    })
    .from(expenses)
    .where(where)
    .groupBy(expenses.category);

  const byCategory = toCategoryAmounts(grouped);
  const totals: ExpenseTotals = {
    count: grouped.reduce((n, g) => n + toCount(g.count), 0),
    amount: toMoney(grouped.reduce((s, g) => s + (Number(g.amount) || 0), 0)),
    byCategory,
  };

  const data: ExpenseRow[] = await db
    .select()
    .from(expenses)
    .where(where)
    .orderBy(...expenseOrder(sort))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return { ...paginatedResult(data, totals.count, page, pageSize), totals };
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
