"use client";

import { Suspense, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/filter-bar";
import { TableSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { usePaginatedFetch } from "@/hooks/use-paginated-fetch";
import { apiPost, apiPut, apiDelete } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";

interface CatalogItem {
  id: number;
  name: string;
  description?: string;
  estimatedPrice: number;
  category: string;
  active: number;
}

const CATEGORIES = [
  "Battery",
  "Movement Service",
  "Crystal Replacement",
  "Case Work",
  "Dial Work",
  "Water Resistance",
  "Strap/Bracelet",
  "Full Service",
  "Restoration",
  "Other",
];

function ServiceCatalogContent() {
  const { toast } = useToast();
  const {
    data: items,
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
  } = usePaginatedFetch<CatalogItem>({ url: "/api/service-catalog" });

  const [searchInput, setSearchInput] = useState(search);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CatalogItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setSearch(value);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiDelete(`/api/service-catalog/${deleteTarget.id}`);
      toast("Service deleted", "success");
      refresh();
    } catch (e: any) {
      toast(e.message || "Failed to delete", "error");
    } finally {
      setDeleteTarget(null);
      setDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
      estimatedPrice: parseFloat(formData.get("estimatedPrice") as string),
      category: formData.get("category") as string,
      active: formData.get("active") === "1" ? 1 : 0,
    };

    try {
      if (editing) {
        await apiPut(`/api/service-catalog/${editing.id}`, data);
        toast("Service updated", "success");
      } else {
        await apiPost("/api/service-catalog", data);
        toast("Service added", "success");
      }
      setFormOpen(false);
      setEditing(null);
      refresh();
    } catch (e: any) {
      toast(e.message || "Failed to save", "error");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service catalog"
        description={`${total} service${total !== 1 ? "s" : ""} offered`}
        actions={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus />
            Add service
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <SearchInput
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search services…"
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
      ) : items.length === 0 ? (
        <EmptyState
          title={search || filters.category ? "No services match your filters" : "No services in the catalog yet"}
          description={
            search || filters.category
              ? "Try a different search term or category."
              : "Add the services you offer so customers can request them."
          }
          action={
            !(search || filters.category) && (
              <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
                <Plus />
                Add service
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
                  <th className="border-b border-border px-4 py-3 text-left text-xs font-medium text-muted-foreground">Service</th>
                  <th className="border-b border-border px-4 py-3 text-left text-xs font-medium text-muted-foreground">Category</th>
                  <th className="border-b border-border px-4 py-3 text-right text-xs font-medium text-muted-foreground">Est. price</th>
                  <th className="border-b border-border px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="border-b border-border px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-border transition-colors hover:bg-accent/50"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.category}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">
                      {formatCurrency(item.estimatedPrice)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={item.active ? "good" : "neutral"}>
                        {item.active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-2">
                        <IconButton
                          aria-label={`Edit ${item.name}`}
                          onClick={() => { setEditing(item); setFormOpen(true); }}
                        >
                          <Pencil />
                        </IconButton>
                        <IconButton
                          aria-label={`Delete ${item.name}`}
                          tone="destructive"
                          onClick={() => setDeleteTarget(item)}
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
        onClose={() => { setFormOpen(false); setEditing(null); }}
        title={editing ? "Edit service" : "Add service"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Service name"
            name="name"
            defaultValue={editing?.name}
            placeholder="e.g. Battery Replacement"
            required
          />
          <Input
            label="Description"
            name="description"
            defaultValue={editing?.description || ""}
            placeholder="Brief description of the service"
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              name="category"
              defaultValue={editing?.category}
              options={CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
            <Input
              label="Estimated price"
              name="estimatedPrice"
              type="number"
              step="0.01"
              defaultValue={editing?.estimatedPrice?.toString()}
              required
            />
          </div>
          <Select
            label="Status"
            name="active"
            defaultValue={editing ? (editing.active ? "1" : "0") : "1"}
            options={[
              { value: "1", label: "Active" },
              { value: "0", label: "Inactive" },
            ]}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => { setFormOpen(false); setEditing(null); }}>
              Cancel
            </Button>
            <Button type="submit">{editing ? "Save changes" : "Add service"}</Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete service"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        loading={deleting}
      />
    </div>
  );
}

export default function ServiceCatalogPage() {
  return (
    <Suspense fallback={<TableSkeleton cols={5} />}>
      <ServiceCatalogContent />
    </Suspense>
  );
}
