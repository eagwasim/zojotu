import { sql, type SQL, type SQLWrapper } from "drizzle-orm";

/*
 * Helpers shared by the paginated list queries (sales, parts, expenses) for the totals
 * strip. All SQL here is portable between Postgres and SQLite.
 */

/**
 * SUM over a money expression, as double precision, never NULL. The columns are `real`
 * (float4 on Postgres), so summing them unconverted would lose cents on large totals.
 * SQLite reads DOUBLE PRECISION as REAL affinity.
 */
export function sumMoney(expr: SQLWrapper): SQL<number> {
  return sql<number>`COALESCE(SUM(CAST(${expr} AS DOUBLE PRECISION)), 0)`;
}

/** Drivers may return aggregates as strings (Postgres bigint) or null; round money to cents. */
export function toMoney(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  // Math.round on the cents avoids -0 and float noise such as 0.30000000000000004.
  const cents = Math.round(n * 100);
  return cents === 0 ? 0 : cents / 100;
}

export function toCount(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

export interface CategoryAmount {
  category: string;
  amount: number;
}

/** Normalise grouped rows: numeric amounts, largest first, then by name for stable order. */
export function toCategoryAmounts(rows: { category: string; amount: unknown }[]): CategoryAmount[] {
  return rows
    .map((r) => ({ category: r.category, amount: toMoney(r.amount) }))
    .sort((a, b) => b.amount - a.amount || a.category.localeCompare(b.category));
}
