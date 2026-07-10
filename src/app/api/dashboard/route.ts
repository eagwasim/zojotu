import { NextRequest, NextResponse } from "next/server";
import { getDashboardKPIs } from "@/lib/queries/dashboard";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const from = params.get("from") || undefined;
  const to = params.get("to") || undefined;

  const period = from || to ? { from, to } : undefined;
  const kpis = await getDashboardKPIs(period);
  return NextResponse.json(kpis);
}
