import { NextRequest, NextResponse } from "next/server";
import { getAllParts, createPart, getPaginatedParts } from "@/lib/queries/parts";
import { partSchema } from "@/lib/validators/part";
import { requireAdmin } from "@/lib/authorize";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const page = params.get("page");

  if (page) {
    const result = await getPaginatedParts({
      page: parseInt(page),
      pageSize: parseInt(params.get("pageSize") || "20"),
      search: params.get("search") || undefined,
      category: params.get("category") || undefined,
      watchId: params.get("watchId") ? parseInt(params.get("watchId")!) : undefined,
    });
    return NextResponse.json(result);
  }

  const watchId = params.get("watchId");
  const parts = await getAllParts(watchId ? parseInt(watchId) : undefined);
  return NextResponse.json(parts);
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json();
  const result = partSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const part = await createPart(result.data);
  return NextResponse.json(part, { status: 201 });
}
