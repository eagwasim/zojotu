import { z } from "zod";

/**
 * Flat fee rate per sales platform, stored as one `app_settings` row
 * (key `platform_fees`, JSON `{ "eBay": 0.13 }`). No schema change; see docs/db-changes.md.
 */
export const PLATFORM_FEES_KEY = "platform_fees";

export const platformFeesSchema = z.record(
  z.string().trim().min(1).max(80),
  z.number().min(0, "Fee can't be negative").max(1, "Enter the fee as a fraction (13% = 0.13)")
);

export type PlatformFees = z.infer<typeof platformFeesSchema>;

export function parsePlatformFees(raw: string | null | undefined): PlatformFees {
  if (!raw) return {};
  try {
    const parsed = platformFeesSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

/** Case-insensitive lookup so "ebay" finds the "eBay" rate. */
export function feeRateFor(fees: PlatformFees, platform: string | null | undefined): number | null {
  if (!platform) return null;
  const key = platform.trim().toLowerCase();
  for (const [name, rate] of Object.entries(fees)) {
    if (name.toLowerCase() === key) return rate;
  }
  return null;
}

/** Fee in money for a price, rounded to cents. */
export function estimateFee(price: number, rate: number): number {
  return Math.round(price * rate * 100) / 100;
}
