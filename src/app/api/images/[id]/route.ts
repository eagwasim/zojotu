import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { watchImages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { deleteImage, getImagePath } from "@/lib/storage";
import fs from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [image] = await db
    .select()
    .from(watchImages)
    .where(eq(watchImages.id, parseInt(id)))
    .limit(1);

  if (!image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  const filePath = await getImagePath(image.filename);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);
  const ext = image.filename.split(".").pop()?.toLowerCase();
  const mimeType =
    ext === "png"
      ? "image/png"
      : ext === "webp"
      ? "image/webp"
      : "image/jpeg";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [image] = await db
    .select()
    .from(watchImages)
    .where(eq(watchImages.id, parseInt(id)))
    .limit(1);

  if (!image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  await deleteImage(image.filename);
  await db.delete(watchImages).where(eq(watchImages.id, parseInt(id)));

  return NextResponse.json({ success: true });
}
