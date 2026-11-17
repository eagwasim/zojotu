import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authorize";
import { getDashboard } from "@/lib/queries/dashboard";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GET /api/dashboard?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Both or neither (all time). The previous period is the same length, immediately before.
 */
export async function GET(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const params = request.nextUrl.searchParams;
  const from = params.get("from");
  const to = params.get("to");

  if (!from && !to) return NextResponse.json(await getDashboard(null));
  if (!from || !to || !ISO.test(from) || !ISO.test(to) || from > to) {
    return NextResponse.json(
      { error: "Pass both from and to as YYYY-MM-DD, with from on or before to" },
      { status: 400 }
    );
  }
  return NextResponse.json(await getDashboard({ from, to }));
}
