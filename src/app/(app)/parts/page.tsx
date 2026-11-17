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

interface Part {
  id: number;
  watchId: number;
  date: string;
  description: string;
  category: string;
  cost: number;
  supplier?: string;
  watchBrand?: string;
  watchModel?: string;
}

const CATEGORIES = [
  "Hardware",
  "Strap",
  "Movement",
  "Glass",
  "Dial",
  "Bezel",
  "Case",
  "Other",
];

function PartsContent() {
  const { toast } = useToast();
  const {
    data: parts,
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
  } = usePaginatedFetch<Part>({ url: "/api/parts" });

  const [searchInput, setSearchInput] = useState(search);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Part | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setSearch(value);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiDelete(`/api/parts/${deleteTarget.id}`);
      toast("Part deleted", "success");
      refresh();
    } catch (e: any) {
      toast(e.message || "Failed to delete part", "error");
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
      date: formData.get("date") as string,
      description: formData.get("description") as string,
      category: formData.get("category") as string,
      cost: parseFloat(formData.get("cost") as string),
      supplier: (formData.get("supplier") as string) || undefined,
    };

    try {
      if (editingPart) {
        await apiPut(`/api/parts/${editingPart.id}`, data);
        toast("Part updated", "success");
      } else {
        await apiPost("/api/parts", data);
        toast("Part added", "success");
      }
      setFormOpen(false);
      setEditingPart(null);
      refresh();
    } catch (e: any) {
      toast(e.message || "Failed to save part", "error");
    }
  };

  const getWatchLabel = (part: Part) => {
    if (part.watchBrand && part.watchModel) {
      return `${part.watchBrand} ${part.watchModel}`;
    }
    return `Watch #${part.watchId}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parts and mods"
        description={`${total} part${total !== 1 ? "s" : ""} tracked`}
        actions={
          <Button onClick={() => { setEditingPart(null); setFormOpen(true); }}>
            <Plus />
            Add part
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search by description…"
        />
        <div className="w-full sm:w-48">
          <Select
            aria-label="Category"
            value={filters.category || ""}
            onChange={(e) => setFilter("category", e.target.value)}
            placeholder="All categories"
            options={CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
        </div>
      </div>

      {loading ? (
        <TableSkeleton cols={7} />
      ) : parts.length === 0 ? (
        <EmptyState
          title="No parts recorded yet"
          description="Add a part to track what you spend on modifications for each watch."
          action={
            <Button variant="secondary" size="sm" onClick={() => { setEditingPart(null); setFormOpen(true); }}>
              <Plus />
              Add part
            </Button>
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl bg-card shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground text-left">Watch</th>
                  <th className="border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground text-left">Description</th>
                  <th className="border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground text-left">Category</th>
                  <th className="border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground text-right">Cost</th>
                  <th className="border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground text-left">Supplier</th>
                  <th className="border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground text-left">Date</th>
                  <th className="border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {parts.map((part) => (
                  <tr
                    key={part.id}
                    className="border-t border-border transition-colors first:border-t-0 hover:bg-accent/50"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{getWatchLabel(part)}</td>
                    <td className="px-4 py-3 text-foreground">{part.description}</td>
                    <td className="px-4 py-3 text-muted-foreground">{part.category}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{formatCurrency(part.cost)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{part.supplier || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(part.date)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <IconButton
                          aria-label={`Edit ${part.description}`}
                          onClick={() => { setEditingPart(part); setFormOpen(true); }}
                        >
                          <Pencil />
                        </IconButton>
                        <IconButton
                          tone="destructive"
                          aria-label={`Delete ${part.description}`}
                          onClick={() => setDeleteTarget(part)}
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
        onClose={() => { setFormOpen(false); setEditingPart(null); }}
        title={editingPart ? "Edit part" : "Add part"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Combobox
            label="Watch"
            name="watchId"
            defaultValue={editingPart?.watchId?.toString()}
            fetchUrl="/api/watches/search"
            placeholder="Search for a watch..."
          />
          <Input
            label="Description"
            name="description"
            defaultValue={editingPart?.description}
            placeholder="e.g. Sapphire Crystal"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              name="category"
              defaultValue={editingPart?.category}
              options={CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
            <Input
              label="Cost"
              name="cost"
              type="number"
              step="0.01"
              defaultValue={editingPart?.cost?.toString()}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              name="date"
              type="date"
              defaultValue={editingPart?.date}
              required
            />
            <Input
              label="Supplier"
              name="supplier"
              defaultValue={editingPart?.supplier || ""}
              placeholder="Optional"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => { setFormOpen(false); setEditingPart(null); }}>
              Cancel
            </Button>
            <Button type="submit">{editingPart ? "Save changes" : "Add part"}</Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete part"
        message={`Are you sure you want to delete "${deleteTarget?.description}"? This action cannot be undone.`}
        loading={deleting}
      />
    </div>
  );
}

export default function PartsPage() {
  return (
    <Suspense fallback={<TableSkeleton cols={7} />}>
      <PartsContent />
    </Suspense>
  );
}
