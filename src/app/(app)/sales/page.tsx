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
import { Combobox } from "@/components/ui/combobox";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { usePaginatedFetch } from "@/hooks/use-paginated-fetch";
import { apiPost, apiPut, apiDelete } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Sale {
  id: number;
  watchId: number;
  saleDate: string;
  platform: string;
  grossSalePrice: number;
  platformFee: number;
  shippingInsurance: number;
  notes?: string;
  watchBrand?: string;
  watchModel?: string;
}

const PLATFORMS = [
  "Chrono24",
  "eBay",
  "Etsy",
  "Facebook Marketplace",
  "Reddit (r/Watchexchange)",
  "Private Sale",
  "Instagram",
  "Vinted",
  "Other",
];

function SalesContent() {
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
    } catch (e: any) {
      toast(e.message || "Failed to delete sale", "error");
    } finally {
      setDeleteTarget(null);
      setDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      watchId: parseInt(formData.get("watchId") as string),
      saleDate: formData.get("saleDate") as string,
      platform: formData.get("platform") as string,
      grossSalePrice: parseFloat(formData.get("grossSalePrice") as string),
      platformFee: parseFloat((formData.get("platformFee") as string) || "0"),
      shippingInsurance: parseFloat(
        (formData.get("shippingInsurance") as string) || "0"
      ),
      notes: (formData.get("notes") as string) || undefined,
    };

    try {
      if (editingSale) {
        await apiPut(`/api/sales/${editingSale.id}`, data);
        toast("Sale updated", "success");
      } else {
        await apiPost("/api/sales", data);
        toast("Sale recorded", "success");
      }
      setFormOpen(false);
      setEditingSale(null);
      refresh();
    } catch (e: any) {
      toast(e.message || "Failed to save sale", "error");
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
            options={PLATFORMS.map((p) => ({ value: p, label: p }))}
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

      <Dialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingSale(null); }}
        title={editingSale ? "Edit sale" : "Record sale"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Combobox
            label="Watch"
            name="watchId"
            defaultValue={editingSale?.watchId?.toString()}
            fetchUrl="/api/watches/search"
            fetchParams={{ excludeStatus: "Sold" }}
            placeholder="Search for a watch..."
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Sale date"
              name="saleDate"
              type="date"
              defaultValue={editingSale?.saleDate}
              required
            />
            <Select
              label="Platform"
              name="platform"
              defaultValue={editingSale?.platform}
              options={PLATFORMS.map((p) => ({ value: p, label: p }))}
            />
          </div>
          <Input
            label="Gross sale price"
            name="grossSalePrice"
            type="number"
            step="0.01"
            defaultValue={editingSale?.grossSalePrice?.toString()}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Platform fee"
              name="platformFee"
              type="number"
              step="0.01"
              defaultValue={editingSale?.platformFee?.toString() || "0"}
            />
            <Input
              label="Shipping & insurance"
              name="shippingInsurance"
              type="number"
              step="0.01"
              defaultValue={editingSale?.shippingInsurance?.toString() || "0"}
            />
          </div>
          <Input
            label="Notes"
            name="notes"
            defaultValue={editingSale?.notes || ""}
            placeholder="Optional notes..."
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => { setFormOpen(false); setEditingSale(null); }}>
              Cancel
            </Button>
            <Button type="submit">{editingSale ? "Save changes" : "Record sale"}</Button>
          </div>
        </form>
      </Dialog>

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
