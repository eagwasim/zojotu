import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authorize";
import { refuseServiceJob } from "@/lib/queries/service-jobs";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json();

  if (!body.reason) {
    return NextResponse.json(
      { error: "Reason is required when refusing a service" },
      { status: 400 }
    );
  }

  const job = await refuseServiceJob(parseInt(id), body.reason);
  return NextResponse.json(job);
}
