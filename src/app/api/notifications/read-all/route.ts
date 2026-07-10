import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authorize";
import { markAllAsRead } from "@/lib/queries/notifications";

export async function PUT(request: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  await markAllAsRead(session!.userId);
  return NextResponse.json({ success: true });
}
