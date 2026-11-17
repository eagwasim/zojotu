import { NextRequest, NextResponse } from "next/server";
import { getSaleById, updateSale, deleteSale } from "@/lib/queries/sales";
import { requireAdmin } from "@/lib/authorize";
import { saleUpdateSchema } from "@/lib/validators/sale";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sale = await getSaleById(parseInt(id));

  if (!sale) {
    return NextResponse.json({ error: "Sale not found" }, { status: 404 });
  }

  return NextResponse.json(sale);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const result = saleUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten() },
      { status: 400 }
    );
  }
  const sale = await updateSale(parseInt(id), result.data);

  if (!sale) {
    return NextResponse.json({ error: "Sale not found" }, { status: 404 });
  }

  return NextResponse.json(sale);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  await deleteSale(parseInt(id));
  return NextResponse.json({ success: true });
}
