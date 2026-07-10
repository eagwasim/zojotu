import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authorize";
import {
  getCatalogItemById,
  updateCatalogItem,
  deleteCatalogItem,
} from "@/lib/queries/service-catalog";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const item = await getCatalogItemById(parseInt(id));
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(item);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json();
  const item = await updateCatalogItem(parseInt(id), body);
  return NextResponse.json(item);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  await deleteCatalogItem(parseInt(id));
  return NextResponse.json({ success: true });
}
