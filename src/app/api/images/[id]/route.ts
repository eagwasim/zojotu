import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { watchImages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { deleteImage, getImagePath } from "@/lib/storage";
import fs from "fs";
import { requireAdmin } from "@/lib/authorize";
import { watches } from "@/lib/db/schema";

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
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const [image] = await db
    .select()
    .from(watchImages)
    .where(eq(watchImages.id, parseInt(id)))
    .limit(1);

  if (!image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  // Don't leave the watch pointing at a deleted cover photo.
  await db
    .update(watches)
    .set({ primaryImageId: null })
    .where(eq(watches.primaryImageId, image.id));

  await deleteImage(image.filename);
  await db.delete(watchImages).where(eq(watchImages.id, parseInt(id)));

  return NextResponse.json({ success: true });
}
