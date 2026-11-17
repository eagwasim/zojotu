import { NextRequest, NextResponse } from "next/server";
import {
  getExpenseById,
  updateExpense,
  deleteExpense,
} from "@/lib/queries/expenses";
import { requireAdmin } from "@/lib/authorize";
import { expenseSchema } from "@/lib/validators/expense";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const expense = await getExpenseById(parseInt(id));

  if (!expense) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  return NextResponse.json(expense);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const result = expenseSchema.partial().safeParse(await request.json().catch(() => null));
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten() },
      { status: 400 }
    );
  }
  const expense = await updateExpense(parseInt(id), result.data);

  if (!expense) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  return NextResponse.json(expense);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  await deleteExpense(parseInt(id));
  return NextResponse.json({ success: true });
}
