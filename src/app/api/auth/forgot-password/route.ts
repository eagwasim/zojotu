import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "@/lib/email";
import { passwordResetEmail } from "@/lib/email/templates/password-reset";
import { hashEmail } from "@/lib/crypto/pii";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  const emailHashValue = hashEmail(email);

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.emailHash, emailHashValue))
    .limit(1);

  // Always return success to prevent email enumeration
  if (!user) {
    return NextResponse.json({ success: true });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.insert(passwordResetTokens).values({
    userId: user.id,
    token,
    expiresAt,
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  const { html, text } = passwordResetEmail(resetUrl, user.displayName);

  await sendEmail({
    to: email,
    subject: "Reset Your Password — Zojotu",
    html,
    text,
  });

  return NextResponse.json({ success: true });
}
