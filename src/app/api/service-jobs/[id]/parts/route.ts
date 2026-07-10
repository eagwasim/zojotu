import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authorize";
import {
  getServiceJobParts,
  addServiceJobPart,
} from "@/lib/queries/service-jobs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const parts = await getServiceJobParts(parseInt(id));
  return NextResponse.json(parts);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json();

  const part = await addServiceJobPart({
    serviceJobId: parseInt(id),
    description: body.description,
    category: body.category,
    cost: body.cost,
    quantity: body.quantity || 1,
    supplier: body.supplier,
  });

  return NextResponse.json(part, { status: 201 });
}
