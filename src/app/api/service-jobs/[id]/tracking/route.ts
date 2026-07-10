import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authorize";
import { updateServiceJob } from "@/lib/queries/service-jobs";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const { trackingNumber, trackingCarrier } = await request.json();

  const job = await updateServiceJob(parseInt(id), {
    trackingNumber,
    trackingCarrier,
    status: "Shipped",
  });

  return NextResponse.json(job);
}
