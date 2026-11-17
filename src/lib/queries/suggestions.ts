import { db } from "../db";
import { parts, sales, watches } from "../db/schema";
import { desc, isNotNull, ne, sql, and } from "drizzle-orm";

export const SUGGESTION_FIELDS = ["brand", "source", "supplier", "platform"] as const;
export type SuggestionField = (typeof SUGGESTION_FIELDS)[number];

/** Platforms offered even before the first sale on them. */
export const DEFAULT_PLATFORMS = [
  "Chrono24",
  "eBay",
  "Etsy",
  "Facebook Marketplace",
  "Reddit (r/Watchexchange)",
  "Private Sale",
  "Instagram",
  "Vinted",
];

type Row = { value: string | null; n: number };

async function distinctByUse(column: any, table: any): Promise<string[]> {
  const rows: Row[] = await db
    .select({ value: column, n: sql<number>`count(*)` })
    .from(table)
    .where(and(isNotNull(column), ne(column, "")))
    .groupBy(column)
    .orderBy(desc(sql`count(*)`))
    .limit(100);
  return rows.map((r) => r.value).filter((v): v is string => !!v);
}

/**
 * Values used before, most frequent first. Case variants are merged
 * ("ebay" and "eBay" become the more common spelling), so suggestions nudge
 * towards one consistent spelling.
 */
export async function getSuggestions(field: SuggestionField): Promise<string[]> {
  let values: string[];
  switch (field) {
    case "brand":
      values = await distinctByUse(watches.brand, watches);
      break;
    case "source":
      values = await distinctByUse(watches.source, watches);
      break;
    case "supplier":
      values = await distinctByUse(parts.supplier, parts);
      break;
    case "platform":
      values = [
        ...(await distinctByUse(sales.platform, sales)),
        ...(await distinctByUse(watches.listedPlatform, watches)),
        ...DEFAULT_PLATFORMS,
      ];
      break;
  }
  const seen = new Map<string, string>();
  for (const v of values) {
    const key = v.trim().toLowerCase();
    if (key && !seen.has(key)) seen.set(key, v.trim());
  }
  return Array.from(seen.values());
}
