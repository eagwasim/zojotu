import { NextRequest, NextResponse } from "next/server";
import { searchWatches } from "@/lib/queries/watches";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const q = params.get("q") || "";
  const excludeStatus = params.get("excludeStatus") || undefined;
  const limit = parseInt(params.get("limit") || "20");

  const results = await searchWatches(q, excludeStatus, limit);
  return NextResponse.json(results);
}
