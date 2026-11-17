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
import { Select } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { RecordSaleSheet } from "@/components/sales/record-sale-sheet";
import { usePaginatedFetch } from "@/hooks/use-paginated-fetch";
import { apiDelete } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useSuggestions } from "@/hooks/use-form-data";

interface Sale {
  id: number;
  watchId: number;
  saleDate: string;
  platform: string;
  grossSalePrice: number;
  platformFee: number;
  shippingInsurance: number;
  notes?: string | null;
  watchBrand?: string;
  watchModel?: string;
}


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
    filters,
    setPage,
    setFilter,
    setSearch,
    search,
    refresh,
  } = usePaginatedFetch<Sale>({ url: "/api/sales" });

  const [searchInput, setSearchInput] = useState(search);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Sale | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setSearch(value);
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

  const getWatchLabel = (sale: Sale) => {
    if (sale.watchBrand && sale.watchModel) {
      return `${sale.watchBrand} ${sale.watchModel}`;
    }
    return `Watch #${sale.watchId}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales"
        description={`${total} sale${total !== 1 ? "s" : ""} recorded`}
        actions={
          <Button onClick={() => { setEditingSale(null); setFormOpen(true); }}>
            <Plus />
            Record sale
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <SearchInput
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search by watch brand or model…"
          className="sm:max-w-sm"
        />
        <div className="w-full sm:w-56">
          <Select
            label="Platform"
            value={filters.platform || ""}
            onChange={(e) => setFilter("platform", e.target.value)}
            placeholder="All platforms"
            options={platformOptions.map((p) => ({ value: p, label: p }))}
          />
        </div>
      </div>

      {loading ? (
        <TableSkeleton cols={7} />
      ) : salesList.length === 0 ? (
        <EmptyState
          title={search || filters.platform ? "No sales match your filters" : "No sales recorded yet"}
          description={
            search || filters.platform
              ? "Try a different search term or platform."
              : "Record a sale when a watch sells to track revenue and fees."
          }
          action={
            !(search || filters.platform) && (
              <Button onClick={() => { setEditingSale(null); setFormOpen(true); }}>
                <Plus />
                Record sale
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
                  <th className="border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground text-left">Watch</th>
                  <th className="border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground text-left">Platform</th>
                  <th className="border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground text-right">Gross price</th>
                  <th className="border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground text-right">Fees</th>
                  <th className="border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground text-right">Net revenue</th>
                  <th className="border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground text-left">Date</th>
                  <th className="border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {salesList.map((sale) => (
                  <tr
                    key={sale.id}
                    className="border-t border-border transition-colors hover:bg-accent/50"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {getWatchLabel(sale)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{sale.platform}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">
                      {formatCurrency(sale.grossSalePrice)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {formatCurrency(sale.platformFee + sale.shippingInsurance)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-foreground">
                      {formatCurrency(
                        sale.grossSalePrice -
                          sale.platformFee -
                          sale.shippingInsurance
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(sale.saleDate)}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-2">
                        <IconButton
                          aria-label={`Edit sale of ${getWatchLabel(sale)}`}
                          onClick={() => { setEditingSale(sale); setFormOpen(true); }}
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
