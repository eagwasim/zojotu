import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { hashEmail, decryptPII } from "./crypto/pii";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "van-christaan-local-secret-key-change-me"
);
const COOKIE_NAME = "vc_session";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(
  userId: number,
  role: string
) {
  const token = await new SignJWT({ userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { userId: number; role: string };
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function authenticate(login: string, password: string) {
  const emailHashValue = hashEmail(login);

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.emailHash, emailHashValue))
    .limit(1);

  if (!user) return null;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;

  return decryptPII("users", user);
}

export async function ensureAdminExists() {
  const adminEmail = "admin@vanchristaan.com";
  const adminEmailHash = hashEmail(adminEmail);

  const [adminExists] = await db
    .select()
    .from(users)
    .where(eq(users.emailHash, adminEmailHash))
    .limit(1);

  if (!adminExists) {
    const { encryptField } = await import("./crypto/pii");
    const hash = await hashPassword("admin");
    await db.insert(users).values({
      passwordHash: hash,
      displayName: encryptField("Administrator") || "Administrator",
      role: "admin",
      email: encryptField(adminEmail) || adminEmail,
      emailHash: adminEmailHash,
    });
  }
}
