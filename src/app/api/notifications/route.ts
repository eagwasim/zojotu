import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authorize";
import { getNotifications, getUnreadCount } from "@/lib/queries/notifications";

export async function GET(request: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const params = request.nextUrl.searchParams;
  const page = parseInt(params.get("page") || "1");
  const pageSize = parseInt(params.get("pageSize") || "20");

  const [result, unreadCount] = await Promise.all([
    getNotifications(session!.userId, { page, pageSize }),
    getUnreadCount(session!.userId),
  ]);

  return NextResponse.json({ ...result, unreadCount });
}
