import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authorize";
import { getPaginatedCustomers } from "@/lib/queries/customers";

export async function GET(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const params = request.nextUrl.searchParams;
  const result = await getPaginatedCustomers({
    page: parseInt(params.get("page") || "1"),
    pageSize: parseInt(params.get("pageSize") || "20"),
    search: params.get("search") || undefined,
  });

  return NextResponse.json(result);
}
