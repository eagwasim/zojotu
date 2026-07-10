import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authorize";
import { markAsRead } from "@/lib/queries/notifications";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  await markAsRead(parseInt(id), session!.userId);
  return NextResponse.json({ success: true });
}
