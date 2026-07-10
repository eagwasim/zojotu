import { db } from "../db";
import { notifications } from "../db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { paginatedResult, type PaginatedResult } from "./pagination";

export async function getNotifications(
  userId: number,
  params: { page: number; pageSize: number }
): Promise<PaginatedResult<any>> {
  const { page, pageSize } = params;
  const where = eq(notifications.userId, userId);

  const [countResult] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(notifications)
    .where(where);

  const total = Number(countResult.count);

  const data = await db
    .select()
    .from(notifications)
    .where(where)
    .orderBy(desc(notifications.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return paginatedResult(data, total, page, pageSize);
}

export async function getUnreadCount(userId: number): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, 0)));
  return Number(result.count);
}

export async function markAsRead(notificationId: number, userId: number) {
  await db
    .update(notifications)
    .set({ read: 1 })
    .where(
      and(eq(notifications.id, notificationId), eq(notifications.userId, userId))
    );
}

export async function markAllAsRead(userId: number) {
  await db
    .update(notifications)
    .set({ read: 1 })
    .where(eq(notifications.userId, userId));
}
