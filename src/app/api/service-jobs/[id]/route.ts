import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/authorize";
import {
  getServiceJobById,
  updateServiceJob,
  deleteServiceJob,
} from "@/lib/queries/service-jobs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const job = await getServiceJobById(parseInt(id));

  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (session!.role === "customer" && job.customerId !== session!.userId) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  return NextResponse.json(job);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json();
  const job = await updateServiceJob(parseInt(id), body);
  return NextResponse.json(job);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  await deleteServiceJob(parseInt(id));
  return NextResponse.json({ success: true });
}
