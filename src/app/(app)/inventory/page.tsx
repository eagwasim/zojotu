"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput, SegmentedFilter } from "@/components/ui/filter-bar";
import { TableSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
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
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description={`${total} watch${total !== 1 ? "es" : ""} in collection`}
        actions={
          <Button
            onClick={() => {
              setEditingWatch(null);
              setFormOpen(true);
            }}
          >
            <Plus />
            Add watch
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search brand or model…"
        />
        <SegmentedFilter
          label="Status"
          value={activeStatus}
          onChange={handleStatusFilter}
          options={[
            { value: "", label: "All" },
            ...STATUSES.map((s) => ({ value: s, label: s })),
          ]}
        />
      </div>

      {loading ? (
        <TableSkeleton cols={7} />
      ) : watches.length === 0 ? (
        <EmptyState
          title="No watches found"
          description="Add a watch to start tracking your collection, or clear the search and status filter."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setFormOpen(true)}
            >
              <Plus />
              Add watch
            </Button>
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl bg-card shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="border-b border-border px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Watch
                  </th>
                  <th className="hidden md:table-cell border-b border-border px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Movement
                  </th>
                  <th className="hidden md:table-cell border-b border-border px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Source
                  </th>
                  <th className="border-b border-border px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                    Cost
                  </th>
                  <th className="border-b border-border px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="hidden lg:table-cell border-b border-border px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="border-b border-border px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {watches.map((watch) => (
                  <tr
                    key={watch.id}
                    className="border-t border-border transition-colors first:border-t-0 hover:bg-accent/50"
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
                    <td className="hidden md:table-cell px-4 py-3 text-muted-foreground">
                      {watch.movementType}
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-muted-foreground">
                      {watch.source}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">
                      {formatCurrency(watch.baseCost)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={watch.status} />
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3 text-muted-foreground">
                      {formatDate(watch.acquisitionDate)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <IconButton
                          aria-label={`View ${watch.brand} ${watch.model}`}
                          onClick={() => router.push(`/inventory/${watch.id}`)}
                        >
                          <Eye />
                        </IconButton>
                        <IconButton
                          aria-label={`Edit ${watch.brand} ${watch.model}`}
                          onClick={() => {
                            setEditingWatch(watch);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil />
                        </IconButton>
                        <IconButton
                          tone="destructive"
                          aria-label={`Delete ${watch.brand} ${watch.model}`}
                          onClick={() => setDeleteTarget(watch)}
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
        onClose={() => {
          setFormOpen(false);
          setEditingWatch(null);
        }}
        title={editingWatch ? "Edit watch" : "Add watch"}
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
              label="Acquisition date"
              name="acquisitionDate"
              type="date"
              defaultValue={editingWatch?.acquisitionDate}
              required
            />
            <Input
              label="Base cost"
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
              {editingWatch ? "Save changes" : "Add watch"}
            </Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete watch"
        message={`Are you sure you want to delete "${deleteTarget?.brand} ${deleteTarget?.model}"? This will also remove all associated parts and sales records. This action cannot be undone.`}
        loading={deleting}
      />
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<TableSkeleton cols={7} />}>
      <InventoryContent />
    </Suspense>
  );
}
