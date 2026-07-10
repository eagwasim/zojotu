import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authorize";
import { acceptServiceJob } from "@/lib/queries/service-jobs";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const job = await acceptServiceJob(parseInt(id));
  return NextResponse.json(job);
}
