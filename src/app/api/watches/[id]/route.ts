import { NextRequest, NextResponse } from "next/server";
import {
  getWatchWithEconomics,
  updateWatch,
  deleteWatch,
} from "@/lib/queries/watches";
import { requireAdmin } from "@/lib/authorize";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const watch = await getWatchWithEconomics(parseInt(id));

  if (!watch) {
    return NextResponse.json({ error: "Watch not found" }, { status: 404 });
  }

  return NextResponse.json(watch);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json();
  const watch = await updateWatch(parseInt(id), body);

  if (!watch) {
    return NextResponse.json({ error: "Watch not found" }, { status: 404 });
  }

  return NextResponse.json(watch);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  await deleteWatch(parseInt(id));
  return NextResponse.json({ success: true });
}
