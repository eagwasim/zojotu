import { NextRequest, NextResponse } from "next/server";
import { authenticate, createSession, ensureAdminExists } from "@/lib/auth";

export async function POST(request: NextRequest) {
  await ensureAdminExists();

  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  const user = await authenticate(email, password);

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  await createSession(user.id, user.role);

  return NextResponse.json({
    user: {
      id: user.id,
      displayName: user.displayName,
      role: user.role,
    },
  });
}
