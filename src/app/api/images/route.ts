import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { watchImages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { saveImageLocally } from "@/lib/storage";
import { requireAdmin } from "@/lib/authorize";
import crypto from "crypto";
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

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
  const allowed: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
  };
  if (!allowed[file.type]) {
    return NextResponse.json({ error: "Upload a JPEG, PNG or WebP image" }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Images must be 15 MB or smaller" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  // Extension comes from the checked MIME type, never from the client's filename.
  const ext = allowed[file.type];
  const filename = `${crypto.randomUUID()}${ext}`;

  await saveImageLocally(buffer, filename);

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
