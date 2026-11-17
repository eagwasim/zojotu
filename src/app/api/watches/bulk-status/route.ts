import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authorize";
import { bulkStatusSchema } from "@/lib/validators/watch";
import { bulkUpdateStatus } from "@/lib/queries/watches";

/**
 * POST /api/watches/bulk-status { ids, status }
 * Sold and written-off watches are skipped: sold is owned by the sale record, and a
 * write-off is undone from the watch page.
 */
export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const result = bulkStatusSchema.safeParse(await request.json().catch(() => null));
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten() },
      { status: 400 }
    );
  }
  const updatedIds = await bulkUpdateStatus(result.data.ids, result.data.status);
  return NextResponse.json({
    updatedIds,
    skipped: result.data.ids.length - updatedIds.length,
  });
}
