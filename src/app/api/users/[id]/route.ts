import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSession, hashPassword } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { encryptField } from "@/lib/crypto/pii";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const userId = parseInt(id);

  if (userId === session.userId) {
    return NextResponse.json(
      { error: "Cannot delete your own account" },
      { status: 400 }
    );
  }

  await db.delete(users).where(eq(users.id, userId));
  return NextResponse.json({ success: true });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const updates: Record<string, any> = {};

  if (body.displayName) updates.displayName = encryptField(body.displayName);
  if (body.role) updates.role = body.role;
  if (body.password) updates.passwordHash = await hashPassword(body.password);

  const [user] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, parseInt(id)))
    .returning({
      id: users.id,
      displayName: users.displayName,
      email: users.email,
      role: users.role,
    });

  return NextResponse.json(user);
}
