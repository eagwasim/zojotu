"use client";

import { Suspense, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sales</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} sale{total !== 1 ? "s" : ""} recorded
          </p>
        </div>
        <Button onClick={() => { setEditingSale(null); setFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Record Sale
        </Button>
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-card p-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by watch brand or model..."
            className="w-full rounded-md border border-input bg-background py-2 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:max-w-md">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Platform</label>
            <select
              value={filters.platform || ""}
              onChange={(e) => setFilter("platform", e.target.value)}
              className="block w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All</option>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : salesList.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-border">
          <p className="text-sm text-muted-foreground">No sales recorded yet</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Watch</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Platform</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Gross Price</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fees</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Net Revenue</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {salesList.map((sale) => (
                    <motion.tr
                      key={sale.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-t border-border transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {getWatchLabel(sale)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{sale.platform}</td>
                      <td className="px-4 py-3 font-mono text-foreground">
                        {formatCurrency(sale.grossSalePrice)}
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">
                        {formatCurrency(sale.platformFee + sale.shippingInsurance)}
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-primary">
                        {formatCurrency(
                          sale.grossSalePrice -
                            sale.platformFee -
                            sale.shippingInsurance
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(sale.saleDate)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setEditingSale(sale); setFormOpen(true); }}
                            className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(sale)}
                            className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
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
        title={editingSale ? "Edit Sale" : "Record Sale"}
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
              label="Sale Date"
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
            label="Gross Sale Price"
            name="grossSalePrice"
            type="number"
            step="0.01"
            defaultValue={editingSale?.grossSalePrice?.toString()}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Platform Fee"
              name="platformFee"
              type="number"
              step="0.01"
              defaultValue={editingSale?.platformFee?.toString() || "0"}
            />
            <Input
              label="Shipping & Insurance"
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
            <Button type="submit">{editingSale ? "Save" : "Record Sale"}</Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Sale"
        message={`Are you sure you want to delete this sale? The watch status will be reverted to "Listed". This action cannot be undone.`}
        loading={deleting}
      />
    </motion.div>
  );
}

export default function SalesPage() {
  return (
    <Suspense fallback={<div className="flex h-40 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
      <SalesContent />
    </Suspense>
  );
}
