import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { watchImages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { saveImageLocally } from "@/lib/storage";
import { requireAdmin } from "@/lib/authorize";
import crypto from "crypto";
import path from "path";

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

  if (!file || !watchId) {
    return NextResponse.json(
      { error: "file and watchId are required" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || ".jpg";
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
