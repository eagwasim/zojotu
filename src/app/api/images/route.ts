import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { watchImages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { saveImageLocally } from "@/lib/storage";
import { requireAdmin } from "@/lib/authorize";
import { fitImageToSize } from "@/lib/images/fit-to-size";
import crypto from "crypto";

/** Largest upload accepted. Anything over 1 MB is resized down before it's stored. */
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export async function GET(request: NextRequest) {
  const watchId = request.nextUrl.searchParams.get("watchId");
  if (!watchId) {
    return NextResponse.json(
      { error: "watchId is required" },
      { status: 400 }
    );
  }

  const images = await db
    .select()
    .from(watchImages)
    .where(eq(watchImages.watchId, parseInt(watchId)));

  return NextResponse.json(images);
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const watchId = formData.get("watchId") as string;
  const stage = (formData.get("stage") as string) || "before";
  const caption = formData.get("caption") as string | null;

  if (!file || !watchId || !Number.isInteger(Number(watchId))) {
    return NextResponse.json(
      { error: "file and watchId are required" },
      { status: 400 }
    );
  }
  const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (!allowed.has(file.type)) {
    return NextResponse.json({ error: "Upload a JPEG, PNG or WebP image" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Images must be 15 MB or smaller" }, { status: 400 });
  }

  let fitted;
  try {
    fitted = await fitImageToSize(Buffer.from(await file.arrayBuffer()), file.type);
  } catch {
    return NextResponse.json({ error: "That image couldn't be read or resized" }, { status: 400 });
  }
  // Extension comes from the stored format, never from the client's filename.
  const filename = `${crypto.randomUUID()}${fitted.ext}`;

  await saveImageLocally(fitted.buffer, filename);

  const [image] = await db
    .insert(watchImages)
    .values({
      watchId: parseInt(watchId),
      filename,
      originalName: file.name,
      stage,
      caption,
    })
    .returning();

  return NextResponse.json(image, { status: 201 });
}
