import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/authorize";
import { db } from "@/lib/db";
import { appSettings } from "@/lib/db/schema";
import { PLATFORM_FEES_KEY, parsePlatformFees, platformFeesSchema } from "@/lib/platform-fees";

/** GET → { "eBay": 0.13, ... } */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const [row] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, PLATFORM_FEES_KEY))
    .limit(1);
  return NextResponse.json(parsePlatformFees(row?.value));
}

/** PUT { "eBay": 0.13, ... } replaces the whole map. */
export async function PUT(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const result = platformFeesSchema.safeParse(await request.json().catch(() => null));
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten() },
      { status: 400 }
    );
  }
  const value = JSON.stringify(result.data);
  const [existing] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, PLATFORM_FEES_KEY))
    .limit(1);
  if (existing) {
    await db.update(appSettings).set({ value }).where(eq(appSettings.key, PLATFORM_FEES_KEY));
  } else {
    await db.insert(appSettings).values({ key: PLATFORM_FEES_KEY, value });
  }
  return NextResponse.json(result.data);
}
