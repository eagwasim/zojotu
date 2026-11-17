import { NextRequest, NextResponse } from "next/server";
import { getPartById, updatePart, deletePart } from "@/lib/queries/parts";
import { requireAdmin } from "@/lib/authorize";
import { partSchema } from "@/lib/validators/part";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const part = await getPartById(parseInt(id));

  if (!part) {
    return NextResponse.json({ error: "Part not found" }, { status: 404 });
  }

  return NextResponse.json(part);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const result = partSchema.partial().safeParse(await request.json().catch(() => null));
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten() },
      { status: 400 }
    );
  }
  const part = await updatePart(parseInt(id), result.data);

  if (!part) {
    return NextResponse.json({ error: "Part not found" }, { status: 404 });
  }

  return NextResponse.json(part);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  await deletePart(parseInt(id));
  return NextResponse.json({ success: true });
}
