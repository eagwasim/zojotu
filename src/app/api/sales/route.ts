import { NextRequest, NextResponse } from "next/server";
import { getAllSales, createSale, getPaginatedSales } from "@/lib/queries/sales";
import { saleSchema } from "@/lib/validators/sale";
import { requireAdmin } from "@/lib/authorize";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const page = params.get("page");

  if (page) {
    const result = await getPaginatedSales({
      page: parseInt(page),
      pageSize: parseInt(params.get("pageSize") || "20"),
      search: params.get("search") || undefined,
      platform: params.get("platform") || undefined,
    });
    return NextResponse.json(result);
  }

  const salesList = await getAllSales();
  return NextResponse.json(salesList);
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json();
  const result = saleSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const sale = await createSale(result.data);
  return NextResponse.json(sale, { status: 201 });
}
