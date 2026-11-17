"use client";

import { Suspense, useState } from "react";
import { Plus, Pencil, Trash2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/filter-bar";
import { TableSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DateInput } from "@/components/ui/date-input";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { SummaryStrip, type SummaryItem } from "@/components/lists/summary-strip";
import { useClearFilters } from "@/components/lists/use-clear-filters";
import { usePaginatedFetch } from "@/hooks/use-paginated-fetch";
import { apiPost, apiPut, apiDelete } from "@/lib/api-client";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { ExpenseTotals } from "@/lib/queries/expenses";

interface Expense {
  id: number;
  date: string;
  category: string;
  description: string;
  amount: number;
}

const PAGE_SIZE = 20;

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
    hasLoaded,
    filters,
    setPage,
    setFilter,
    setSearch,
    search,
    refresh,
    sort,
    setSort,
    meta,
  } = usePaginatedFetch<Expense>({ url: "/api/expenses", pageSize: PAGE_SIZE });
  const clearFilters = useClearFilters();

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

  const filtered = !!(search || filters.category);
  const totals = meta.totals as ExpenseTotals | undefined;
  const refetching = loading && hasLoaded;
  const showStrip = !hasLoaded || filtered || (totals?.count ?? 0) > 0;

  const handleClearFilters = () => {
    setSearchInput("");
    clearFilters();
  };

  const summary: SummaryItem[] = [
    { label: "Total spent", value: totals && formatCurrency(totals.amount) },
    { label: "Expenses", value: totals && String(totals.count) },
  ];
  // The biggest categories, unless a category filter already narrows it to one.
  if (totals && !filters.category) {
    for (const c of totals.byCategory.slice(0, 2)) {
      summary.push({
        label: c.category,
        value: formatCurrency(c.amount),
        hint: totals.amount > 0 ? `${Math.round((c.amount / totals.amount) * 100)}% of spend` : undefined,
      });
    }
  }

  const columns: Column<Expense>[] = [
    {
      key: "description",
      header: "Description",
      cell: (expense) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">{expense.description}</p>
          {/* Category and date columns are hidden on a phone; keep them visible here. */}
          <p className="text-xs text-muted-foreground sm:hidden">
            {expense.category} · {formatDate(expense.date)}
          </p>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      hideBelow: "sm",
      cell: (expense) => <span className="text-muted-foreground">{expense.category}</span>,
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      hideBelow: "sm",
      className: "whitespace-nowrap",
      cell: (expense) => <span className="text-muted-foreground">{formatDate(expense.date)}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      sortable: true,
      className: "whitespace-nowrap font-medium text-foreground",
      cell: (expense) => formatCurrency(expense.amount),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      className: "py-2 pl-2",
      cell: (expense) => (
        <div className="flex items-center justify-end gap-2">
          <IconButton aria-label={`Edit ${expense.description}`} onClick={() => openForm(expense)}>
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
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Business costs that aren't tied to a single watch: tools, supplies, software."
        actions={
          <Button onClick={() => openForm(null)}>
            <Plus />
            Add expense
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search by description…"
          className="sm:max-w-sm"
        />
        <div className="w-full sm:w-56">
          <Select
            aria-label="Category"
            value={filters.category || ""}
            onChange={(e) => setFilter("category", e.target.value)}
            placeholder="All categories"
            options={CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
        </div>
      </div>

      {showStrip && <SummaryStrip filtered={filtered} stale={refetching} items={summary} />}

      <div aria-busy={loading} className={cn("space-y-4 transition-opacity duration-150", refetching && "opacity-60")}>
        <DataTable
          columns={columns}
          rows={expenses}
          getRowId={(expense) => expense.id}
          loading={!hasLoaded}
          sort={sort}
          onSortChange={setSort}
          caption="Expenses"
          empty={
            filtered ? (
              <EmptyState
                icon={Wallet}
                title="No expenses match these filters"
                description="Try another search term or category."
                action={
                  <Button variant="secondary" size="sm" onClick={handleClearFilters}>
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={Wallet}
                title="No expenses recorded yet"
                description="Add tools, supplies and other running costs so the dashboard can net them off your profit."
                action={
                  <Button size="sm" onClick={() => openForm(null)}>
                    <Plus />
                    Add expense
                  </Button>
                }
              />
            )
          }
        />

        {expenses.length > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        )}
      </div>

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
