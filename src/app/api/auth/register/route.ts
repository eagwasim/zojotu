import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, createSession } from "@/lib/auth";
import { encryptField, hashEmail } from "@/lib/crypto/pii";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { displayName, email, phone, password } = body;

  if (!displayName || !email || !password) {
    return NextResponse.json(
      { error: "Name, email, and password are required" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const emailHashValue = hashEmail(email);

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.emailHash, emailHashValue))
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values({
      passwordHash,
      displayName: encryptField(displayName) || displayName,
      role: "customer",
      email: encryptField(email) || email,
      emailHash: emailHashValue,
      phone: encryptField(phone) || null,
    })
    .returning();

  await createSession(user.id, user.role);

  return NextResponse.json(
    {
      id: user.id,
      displayName: displayName,
      role: user.role,
      email: email,
    },
    { status: 201 }
  );
}
