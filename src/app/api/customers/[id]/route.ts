import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authorize";
import { getCustomerById, getCustomerStats } from "@/lib/queries/customers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const customer = await getCustomerById(parseInt(id));

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const stats = await getCustomerStats(parseInt(id));

  return NextResponse.json({ ...customer, ...stats });
}
