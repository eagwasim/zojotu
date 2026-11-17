import { NextRequest, NextResponse } from "next/server";
import {
  getWatchWithEconomics,
  updateWatch,
  deleteWatch,
} from "@/lib/queries/watches";
import { requireAdmin } from "@/lib/authorize";
import { watchUpdateSchema } from "@/lib/validators/watch";

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
  const result = watchUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten() },
      { status: 400 }
    );
  }
  const watch = await updateWatch(parseInt(id), result.data);

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
