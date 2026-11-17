"use client";

import { Suspense, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/filter-bar";
import { TableSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DateInput } from "@/components/ui/date-input";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { usePaginatedFetch } from "@/hooks/use-paginated-fetch";
import { apiPost, apiPut, apiDelete } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Expense {
  id: number;
  date: string;
  category: string;
  description: string;
  amount: number;
}

const CATEGORIES = [
  "Tools",
  "Supplies",
  "Software",
  "Shipping",
  "Marketing",
  "Other",
];

// New expenses default to the category used last in this browser session.
const LAST_CATEGORY_KEY = "expenses:last-category";

function lastCategory(): string | undefined {
  try {
    const v = sessionStorage.getItem(LAST_CATEGORY_KEY);
    return v && CATEGORIES.includes(v) ? v : undefined;
  } catch {
    return undefined;
  }
}

const errorMessage = (e: unknown, fallback: string) =>
  e instanceof Error && e.message ? e.message : fallback;

function ExpensesContent() {
  const { toast } = useToast();
  const {
    data: expenses,
    total,
    page,
    totalPages,
    loading,
    filters,
    setPage,
    setFilter,
    setSearch,
    search,
    refresh,
  } = usePaginatedFetch<Expense>({ url: "/api/expenses" });

  const [searchInput, setSearchInput] = useState(search);
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [defaultCategory, setDefaultCategory] = useState<string | undefined>();

  const openForm = (expense: Expense | null) => {
    setEditingExpense(expense);
    setDefaultCategory(expense ? expense.category : lastCategory());
    setFormOpen(true);
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setSearch(value);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiDelete(`/api/expenses/${deleteTarget.id}`);
      toast("Expense deleted", "success");
      refresh();
    } catch (e) {
      toast(errorMessage(e, "Failed to delete expense"), "error");
    } finally {
      setDeleteTarget(null);
      setDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      date: formData.get("date") as string,
      category: formData.get("category") as string,
      description: formData.get("description") as string,
      amount: parseFloat(formData.get("amount") as string),
    };

    try {
      if (editingExpense) {
        await apiPut(`/api/expenses/${editingExpense.id}`, data);
        toast("Expense updated", "success");
      } else {
        await apiPost("/api/expenses", data);
        toast("Expense added", "success");
        try {
          sessionStorage.setItem(LAST_CATEGORY_KEY, data.category);
        } catch {}
      }
      setFormOpen(false);
      setEditingExpense(null);
      refresh();
    } catch (e) {
      toast(errorMessage(e, "Failed to save expense"), "error");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description={`${total} expense${total !== 1 ? "s" : ""} recorded`}
        actions={
          <Button onClick={() => openForm(null)}>
            <Plus />
            Add expense
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <SearchInput
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search by description…"
          className="sm:max-w-sm"
        />
        <div className="w-full sm:w-56">
          <Select
            label="Category"
            value={filters.category || ""}
            onChange={(e) => setFilter("category", e.target.value)}
            placeholder="All categories"
            options={CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
        </div>
      </div>

      {loading ? (
        <TableSkeleton cols={5} />
      ) : expenses.length === 0 ? (
        <EmptyState
          title={search || filters.category ? "No expenses match your filters" : "No expenses recorded yet"}
          description={
            search || filters.category
              ? "Try a different search term or category."
              : "Add tools, parts and other business costs to track them against revenue."
          }
          action={
            !(search || filters.category) && (
              <Button onClick={() => openForm(null)}>
                <Plus />
                Add expense
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl bg-card shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground text-left">Description</th>
                  <th className="border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground text-left">Category</th>
                  <th className="border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground text-right">Amount</th>
                  <th className="border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground text-left">Date</th>
                  <th className="border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="border-t border-border transition-colors hover:bg-accent/50"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{expense.description}</td>
                    <td className="px-4 py-3 text-muted-foreground">{expense.category}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{formatCurrency(expense.amount)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(expense.date)}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-2">
                        <IconButton
                          aria-label={`Edit ${expense.description}`}
                          onClick={() => openForm(expense)}
                        >
                          <Pencil />
                        </IconButton>
                        <IconButton
                          aria-label={`Delete ${expense.description}`}
                          tone="destructive"
                          onClick={() => setDeleteTarget(expense)}
                        >
                          <Trash2 />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={20}
            onPageChange={setPage}
          />
        </>
      )}

      <Dialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingExpense(null); }}
        title={editingExpense ? "Edit expense" : "Add expense"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Description"
            name="description"
            defaultValue={editingExpense?.description}
            placeholder="e.g. Bergeon Spring Bar Tool"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              name="category"
              defaultValue={defaultCategory}
              placeholder={false}
              options={CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
            <CurrencyInput
              label="Amount"
              name="amount"
              defaultValue={editingExpense?.amount}
              required
            />
          </div>
          <DateInput
            label="Date"
            name="date"
            defaultValue={editingExpense?.date}
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => { setFormOpen(false); setEditingExpense(null); }}>
              Cancel
            </Button>
            <Button type="submit">{editingExpense ? "Save changes" : "Add expense"}</Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete expense"
        message={`Are you sure you want to delete "${deleteTarget?.description}"? This action cannot be undone.`}
        loading={deleting}
      />
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={<TableSkeleton cols={5} />}>
      <ExpensesContent />
    </Suspense>
  );
}
