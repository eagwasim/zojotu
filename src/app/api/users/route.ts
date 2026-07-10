import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword, getSession } from "@/lib/auth";
import { z } from "zod";
import { encryptField, hashEmail, decryptPIIList } from "@/lib/crypto/pii";

const createUserSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(4, "Password must be at least 4 characters"),
  displayName: z.string().min(1, "Display name is required"),
  role: z.enum(["admin", "user"]).default("user"),
});

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const allUsers = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users);

  return NextResponse.json(decryptPIIList("users", allUsers));
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const result = createUserSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(result.data.password);

  try {
    const [user] = await db
      .insert(users)
      .values({
        passwordHash,
        displayName: encryptField(result.data.displayName) || result.data.displayName,
        email: encryptField(result.data.email) || result.data.email,
        emailHash: hashEmail(result.data.email),
        role: result.data.role,
      })
      .returning({
        id: users.id,
        displayName: users.displayName,
        email: users.email,
        role: users.role,
      });

    return NextResponse.json(user, { status: 201 });
  } catch (e: any) {
    if (e.message?.includes("unique") || e.code === "23505") {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }
    throw e;
  }
}
