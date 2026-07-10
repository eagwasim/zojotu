import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authorize";
import {
  getPaginatedCatalogItems,
  getAllCatalogItems,
  createCatalogItem,
} from "@/lib/queries/service-catalog";
import { serviceCatalogSchema } from "@/lib/validators/service-catalog";

export async function GET(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const params = request.nextUrl.searchParams;
  const page = params.get("page");

  if (page) {
    const result = await getPaginatedCatalogItems({
      page: parseInt(page),
      pageSize: parseInt(params.get("pageSize") || "20"),
      search: params.get("search") || undefined,
      category: params.get("category") || undefined,
    });
    return NextResponse.json(result);
  }

  const items = await getAllCatalogItems();
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json();
  const result = serviceCatalogSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const item = await createCatalogItem(result.data);
  return NextResponse.json(item, { status: 201 });
}
