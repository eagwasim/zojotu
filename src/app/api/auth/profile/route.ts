import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { decryptPII, encryptField } from "@/lib/crypto/pii";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const [user] = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      email: users.email,
      phone: users.phone,
      address: users.address,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(decryptPII("users", user));
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const updates: any = {};

  if (body.displayName) updates.displayName = encryptField(body.displayName);
  if (body.phone !== undefined) updates.phone = body.phone ? encryptField(body.phone) : null;
  if (body.address !== undefined) updates.address = body.address ? encryptField(body.address) : null;

  await db.update(users).set(updates).where(eq(users.id, session.userId));

  return NextResponse.json({ success: true });
}
