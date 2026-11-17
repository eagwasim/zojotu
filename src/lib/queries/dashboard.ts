import { eq } from "drizzle-orm";
import { db } from "../db";
import {
  appSettings,
  expenses,
  parts,
  sales,
  serviceJobParts,
  serviceJobs,
  watches,
} from "../db/schema";
import { PLATFORM_FEES_KEY, parsePlatformFees } from "../platform-fees";
import { computeDashboard, type Dashboard, type DateRange } from "../dashboard/compute";

export type { Dashboard, DateRange } from "../dashboard/compute";

/** Today as YYYY-MM-DD in the server's local time zone. */
function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Loads the rows the dashboard needs and hands them to `computeDashboard`.
 * Volumes are small (one business), so one read per table and in-memory
 * aggregation keeps every figure consistent and testable.
 */
export async function getDashboard(range: DateRange | null, today = localToday()): Promise<Dashboard> {
  const [w, p, s, e, j, jp, feeRow] = await Promise.all([
    db.select().from(watches),
    db.select().from(parts),
    db.select().from(sales),
    db.select().from(expenses),
    db.select().from(serviceJobs),
    db.select().from(serviceJobParts),
    db.select().from(appSettings).where(eq(appSettings.key, PLATFORM_FEES_KEY)),
  ]);

  return computeDashboard(
    {
      watches: w,
      parts: p,
      sales: s,
      expenses: e,
      serviceJobs: j,
      serviceParts: jp,
      platformFees: parsePlatformFees(feeRow[0]?.value),
      today,
    },
    range
  );
}
