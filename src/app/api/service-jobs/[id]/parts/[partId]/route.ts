import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authorize";
import { deleteServiceJobPart } from "@/lib/queries/service-jobs";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; partId: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { partId } = await params;
  await deleteServiceJobPart(parseInt(partId));
  return NextResponse.json({ success: true });
}
