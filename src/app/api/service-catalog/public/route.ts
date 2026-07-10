import { NextResponse } from "next/server";
import { getActiveCatalogItems } from "@/lib/queries/service-catalog";

export async function GET() {
  const items = await getActiveCatalogItems();
  return NextResponse.json(items);
}
