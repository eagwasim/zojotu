"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Eye, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { usePaginatedFetch } from "@/hooks/use-paginated-fetch";
import { apiPost, apiPut, apiDelete } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Watch {
  id: number;
  brand: string;
  model: string;
  movementType: string;
  acquisitionDate: string;
  source: string;
  baseCost: number;
  status: string;
  notes?: string;
}

const STATUSES = ["In Inventory", "Modding", "Listed", "Sold"];
const MOVEMENTS = [
  "Automatic",
  "Quartz",
  "Manual",
  "Solar",
  "Mecha-Quartz",
  "Vintage Manual",
];

function InventoryContent() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    data: watches,
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
  } = usePaginatedFetch<Watch>({ url: "/api/watches" });

  const [searchInput, setSearchInput] = useState(search);
  const [formOpen, setFormOpen] = useState(false);
  const [editingWatch, setEditingWatch] = useState<Watch | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Watch | null>(null);
  const [deleting, setDeleting] = useState(false);

  const activeStatus = filters.status || "";

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setSearch(value);
  };

  const handleStatusFilter = (status: string) => {
    setFilter("status", status);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiDelete(`/api/watches/${deleteTarget.id}`);
      toast("Watch deleted successfully", "success");
      refresh();
    } catch (e: any) {
      toast(e.message || "Failed to delete watch", "error");
    } finally {
      setDeleteTarget(null);
      setDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      brand: formData.get("brand") as string,
      model: formData.get("model") as string,
      movementType: formData.get("movementType") as string,
      acquisitionDate: formData.get("acquisitionDate") as string,
      source: formData.get("source") as string,
      baseCost: parseFloat(formData.get("baseCost") as string),
      status: formData.get("status") as string,
      notes: (formData.get("notes") as string) || undefined,
    };

    try {
      if (editingWatch) {
        await apiPut(`/api/watches/${editingWatch.id}`, data);
        toast("Watch updated successfully", "success");
      } else {
        await apiPost("/api/watches", data);
        toast("Watch added successfully", "success");
      }
      setFormOpen(false);
      setEditingWatch(null);
      refresh();
    } catch (e: any) {
      toast(e.message || "Failed to save watch", "error");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} watch{total !== 1 ? "es" : ""} in collection
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingWatch(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Watch
        </Button>
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-card p-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search brand or model..."
            className="w-full rounded-md border border-input bg-background py-2 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Status</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleStatusFilter("")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                !activeStatus
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              All
            </button>
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => handleStatusFilter(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  activeStatus === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : watches.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-border">
          <p className="text-sm text-muted-foreground">No watches found</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => setFormOpen(true)}
          >
            Add your first watch
          </Button>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Watch
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Movement
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Source
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Cost
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {watches.map((watch) => (
                    <motion.tr
                      key={watch.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-t border-border transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {watch.brand}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {watch.model}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {watch.movementType}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {watch.source}
                      </td>
                      <td className="px-4 py-3 font-mono text-foreground">
                        {formatCurrency(watch.baseCost)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={watch.status} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(watch.acquisitionDate)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() =>
                              router.push(`/inventory/${watch.id}`)
                            }
                            className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingWatch(watch);
                              setFormOpen(true);
                            }}
                            className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(watch)}
                            className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            title="Delete"
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
        onClose={() => {
          setFormOpen(false);
          setEditingWatch(null);
        }}
        title={editingWatch ? "Edit Watch" : "Add Watch"}
        className="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Brand"
              name="brand"
              defaultValue={editingWatch?.brand}
              placeholder="e.g. Seiko"
              required
            />
            <Input
              label="Model"
              name="model"
              defaultValue={editingWatch?.model}
              placeholder="e.g. SKX007"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Movement"
              name="movementType"
              defaultValue={editingWatch?.movementType}
              options={MOVEMENTS.map((m) => ({ value: m, label: m }))}
            />
            <Select
              label="Status"
              name="status"
              defaultValue={editingWatch?.status || "In Inventory"}
              options={STATUSES.map((s) => ({ value: s, label: s }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Acquisition Date"
              name="acquisitionDate"
              type="date"
              defaultValue={editingWatch?.acquisitionDate}
              required
            />
            <Input
              label="Base Cost"
              name="baseCost"
              type="number"
              step="0.01"
              defaultValue={editingWatch?.baseCost?.toString()}
              placeholder="0.00"
              required
            />
          </div>
          <Input
            label="Source"
            name="source"
            defaultValue={editingWatch?.source}
            placeholder="e.g. eBay, Private, Chrono24"
            required
          />
          <Input
            label="Notes"
            name="notes"
            defaultValue={editingWatch?.notes || ""}
            placeholder="Optional notes..."
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setFormOpen(false);
                setEditingWatch(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingWatch ? "Save Changes" : "Add Watch"}
            </Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Watch"
        message={`Are you sure you want to delete "${deleteTarget?.brand} ${deleteTarget?.model}"? This will also remove all associated parts and sales records. This action cannot be undone.`}
        loading={deleting}
      />
    </motion.div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<div className="flex h-40 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
      <InventoryContent />
    </Suspense>
  );
}
