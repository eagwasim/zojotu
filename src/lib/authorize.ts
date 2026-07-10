import { NextResponse } from "next/server";
import { getSession } from "./auth";

export async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }
  return null;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }), session: null };
  }
  return { error: null, session };
}

export async function requireRole(...roles: string[]) {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }), session: null };
  }
  if (!roles.includes(session.role)) {
    return { error: NextResponse.json({ error: "Access denied" }, { status: 403 }), session: null };
  }
  return { error: null, session };
}

export async function requireOwnerOrAdmin(resourceCustomerId: number) {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }), session: null };
  }
  if (session.role !== "admin" && session.userId !== resourceCustomerId) {
    return { error: NextResponse.json({ error: "Access denied" }, { status: 403 }), session: null };
  }
  return { error: null, session };
}
