import { NextRequest, NextResponse } from "next/server";
import { getAllWatches, createWatch, getPaginatedWatches } from "@/lib/queries/watches";
import { watchSchema } from "@/lib/validators/watch";
import { requireAdmin } from "@/lib/authorize";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const page = params.get("page");

  if (page) {
    const result = await getPaginatedWatches({
      page: parseInt(page),
      pageSize: parseInt(params.get("pageSize") || "20"),
      status: params.get("status") || undefined,
      search: params.get("search") || undefined,
    });
    return NextResponse.json(result);
  }

  const status = params.get("status") || undefined;
  const watches = await getAllWatches(status);
  return NextResponse.json(watches);
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json();
  const result = watchSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const watch = await createWatch(result.data);
  return NextResponse.json(watch, { status: 201 });
}
