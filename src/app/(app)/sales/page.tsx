"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/filter-bar";
import { TableSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Select } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { SummaryStrip } from "@/components/lists/summary-strip";
import { useClearFilters } from "@/components/lists/use-clear-filters";
import { RecordSaleSheet } from "@/components/sales/record-sale-sheet";
import { usePaginatedFetch } from "@/hooks/use-paginated-fetch";
import { apiDelete } from "@/lib/api-client";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { saleFees } from "@/lib/profit";
import { useSuggestions } from "@/hooks/use-form-data";
import type { SaleTotals } from "@/lib/queries/sales";

interface Sale {
  id: number;
  watchId: number;
  saleDate: string;
  platform: string;
  grossSalePrice: number;
  platformFee: number;
  shippingInsurance: number;
  notes?: string | null;
  watchBrand?: string | null;
  watchModel?: string | null;
  /** Purchase cost + parts, from the API. */
  costBasis: number;
  /** Price − fees − cost basis, from the API (src/lib/profit.ts). */
  profit: number;
}

const PAGE_SIZE = 20;

const getWatchLabel = (sale: Sale) =>
  sale.watchBrand && sale.watchModel ? `${sale.watchBrand} ${sale.watchModel}` : `Watch #${sale.watchId}`;

function SalesContent() {
  // Platforms actually used (plus common ones), so any platform recorded on a sale can be filtered.
  const platformOptions = useSuggestions("platform");
  const { toast } = useToast();
  const {
    data: salesList,
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
  } = usePaginatedFetch<Sale>({ url: "/api/sales", pageSize: PAGE_SIZE });
  const clearFilters = useClearFilters();

  const [searchInput, setSearchInput] = useState(search);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Sale | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = !!(search || filters.platform);
  const totals = meta.totals as SaleTotals | undefined;
  const refetching = loading && hasLoaded;

  const openNew = () => {
    setEditingSale(null);
    setFormOpen(true);
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setSearch(value);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    clearFilters();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiDelete(`/api/sales/${deleteTarget.id}`);
      toast("Sale deleted", "success");
      refresh();
    } catch (e) {
      toast(e instanceof Error && e.message ? e.message : "Failed to delete sale", "error");
    } finally {
      setDeleteTarget(null);
      setDeleting(false);
    }
  };

  const columns: Column<Sale>[] = [
    {
      key: "watch",
      header: "Watch",
      sortable: true,
      cell: (sale) => (
        <div className="min-w-0">
          <Link
            href={`/inventory/${sale.watchId}`}
            className="font-medium text-foreground underline-offset-2 hover:underline"
          >
            {getWatchLabel(sale)}
          </Link>
          {/* Date and platform columns are hidden on a phone; keep them visible here. */}
          <p className="text-xs text-muted-foreground sm:hidden">
            {formatDate(sale.saleDate)} · {sale.platform}
          </p>
        </div>
      ),
    },
    {
      key: "platform",
      header: "Platform",
      sortable: true,
      hideBelow: "md",
      cell: (sale) => <span className="text-muted-foreground">{sale.platform}</span>,
    },
    {
      key: "date",
      header: "Sold",
      sortable: true,
      hideBelow: "sm",
      className: "whitespace-nowrap",
      cell: (sale) => <span className="text-muted-foreground">{formatDate(sale.saleDate)}</span>,
    },
    {
      key: "price",
      header: "Price",
      align: "right",
      sortable: true,
      className: "whitespace-nowrap",
      cell: (sale) => formatCurrency(sale.grossSalePrice),
    },
    {
      key: "fees",
      header: "Fees & shipping",
      align: "right",
      hideBelow: "lg",
      className: "whitespace-nowrap text-muted-foreground",
      cell: (sale) => formatCurrency(saleFees(sale)),
    },
    {
      key: "profit",
      header: "Profit",
      align: "right",
      sortable: true,
      className: "whitespace-nowrap font-medium",
      cell: (sale) => (
        <span className={sale.profit < 0 ? "text-critical-ink" : "text-foreground"}>
          {formatCurrency(sale.profit)}
        </span>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      className: "py-2 pl-2",
      cell: (sale) => (
        <div className="flex items-center justify-end gap-2">
          <IconButton
            aria-label={`Edit sale of ${getWatchLabel(sale)}`}
            onClick={() => {
              setEditingSale(sale);
              setFormOpen(true);
            }}
          >
            <Pencil />
          </IconButton>
          <IconButton
            aria-label={`Delete sale of ${getWatchLabel(sale)}`}
            tone="destructive"
            onClick={() => setDeleteTarget(sale)}
          >
            <Trash2 />
          </IconButton>
        </div>
      ),
    },
  ];

  const showStrip = !hasLoaded || filtered || (totals?.count ?? 0) > 0;
  const margin = totals && totals.revenue > 0 ? totals.profit / totals.revenue : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales"
        description="Every sale, with fees and profit after purchase cost and parts."
        actions={
          <Button onClick={openNew}>
            <Plus />
            Record sale
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search by watch brand or model…"
          className="sm:max-w-sm"
        />
        <div className="w-full sm:w-56">
          <Select
            aria-label="Platform"
            value={filters.platform || ""}
            onChange={(e) => setFilter("platform", e.target.value)}
            placeholder="All platforms"
            options={platformOptions.map((p) => ({ value: p, label: p }))}
          />
        </div>
      </div>

      {showStrip && (
        <SummaryStrip
          filtered={filtered}
          stale={refetching}
          items={[
            { label: "Sales", value: totals && String(totals.count) },
            { label: "Revenue", value: totals && formatCurrency(totals.revenue) },
            { label: "Fees & shipping", value: totals && formatCurrency(totals.fees) },
            {
              label: "Profit",
              value: totals && formatCurrency(totals.profit),
              hint: margin === null ? undefined : `${(margin * 100).toFixed(1)}% margin`,
              tone: totals && totals.profit < 0 ? "critical" : "default",
            },
          ]}
        />
      )}

      <div aria-busy={loading} className={cn("space-y-4 transition-opacity duration-150", refetching && "opacity-60")}>
        <DataTable
          columns={columns}
          rows={salesList}
          getRowId={(sale) => sale.id}
          loading={!hasLoaded}
          sort={sort}
          onSortChange={setSort}
          caption="Sales"
          empty={
            filtered ? (
              <EmptyState
                icon={Receipt}
                title="No sales match these filters"
                description="Try another search term or platform."
                action={
                  <Button variant="secondary" size="sm" onClick={handleClearFilters}>
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={Receipt}
                title="No sales recorded yet"
                description="When a watch sells, record the sale here (or from the watch's page) to track revenue, fees and profit."
                action={
                  <Button size="sm" onClick={openNew}>
                    <Plus />
                    Record sale
                  </Button>
                }
              />
            )
          }
        />

        {salesList.length > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        )}
      </div>

      <RecordSaleSheet
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingSale(null); }}
        sale={editingSale}
        onSaved={() => refresh()}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete sale"
        message={`Are you sure you want to delete this sale? The watch status will be reverted to "Listed". This action cannot be undone.`}
        loading={deleting}
      />
    </div>
  );
}

export default function SalesPage() {
  return (
    <Suspense fallback={<TableSkeleton cols={7} />}>
      <SalesContent />
    </Suspense>
  );
}
