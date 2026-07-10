import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authorize";
import {
  getPaginatedServiceJobs,
  createServiceJob,
} from "@/lib/queries/service-jobs";
import { serviceJobCreateSchema } from "@/lib/validators/service-job";

export async function GET(request: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const params = request.nextUrl.searchParams;
  const page = parseInt(params.get("page") || "1");
  const pageSize = parseInt(params.get("pageSize") || "20");
  const status = params.get("status") || undefined;
  const search = params.get("search") || undefined;
  const dateFrom = params.get("dateFrom") || undefined;
  const dateTo = params.get("dateTo") || undefined;
  const sortBy = params.get("sortBy") || undefined;
  const sortOrder = (params.get("sortOrder") as "asc" | "desc") || undefined;

  const customerId =
    session!.role === "customer" ? session!.userId : undefined;

  const result = await getPaginatedServiceJobs({
    page,
    pageSize,
    status,
    customerId,
    search,
    dateFrom,
    dateTo,
    sortBy,
    sortOrder,
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const body = await request.json();
  const result = serviceJobCreateSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const customerId =
    session!.role === "customer"
      ? session!.userId
      : body.customerId;

  if (!customerId) {
    return NextResponse.json(
      { error: "Customer ID is required" },
      { status: 400 }
    );
  }

  const job = await createServiceJob({
    ...result.data,
    customerId,
  });

  return NextResponse.json(job, { status: 201 });
}
