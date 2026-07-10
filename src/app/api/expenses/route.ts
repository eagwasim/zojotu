import { NextRequest, NextResponse } from "next/server";
import { getAllExpenses, createExpense, getPaginatedExpenses } from "@/lib/queries/expenses";
import { expenseSchema } from "@/lib/validators/expense";
import { requireAdmin } from "@/lib/authorize";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const page = params.get("page");

  if (page) {
    const result = await getPaginatedExpenses({
      page: parseInt(page),
      pageSize: parseInt(params.get("pageSize") || "20"),
      search: params.get("search") || undefined,
      category: params.get("category") || undefined,
    });
    return NextResponse.json(result);
  }

  const expensesList = await getAllExpenses();
  return NextResponse.json(expensesList);
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json();
  const result = expenseSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const expense = await createExpense(result.data);
  return NextResponse.json(expense, { status: 201 });
}
