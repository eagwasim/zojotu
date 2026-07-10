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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Parts & Mods</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} part{total !== 1 ? "s" : ""} tracked
          </p>
        </div>
        <Button onClick={() => { setEditingPart(null); setFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Part
        </Button>
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-card p-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by description..."
            className="w-full rounded-md border border-input bg-background py-2 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:max-w-md">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Category</label>
            <select
              value={filters.category || ""}
              onChange={(e) => setFilter("category", e.target.value)}
              className="block w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : parts.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-border">
          <p className="text-sm text-muted-foreground">No parts recorded yet</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Watch</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cost</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Supplier</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {parts.map((part) => (
                    <motion.tr
                      key={part.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-t border-border transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">{getWatchLabel(part)}</td>
                      <td className="px-4 py-3 text-foreground">{part.description}</td>
                      <td className="px-4 py-3 text-muted-foreground">{part.category}</td>
                      <td className="px-4 py-3 font-mono text-foreground">{formatCurrency(part.cost)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{part.supplier || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(part.date)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setEditingPart(part); setFormOpen(true); }}
                            className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(part)}
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
        onClose={() => { setFormOpen(false); setEditingPart(null); }}
        title={editingPart ? "Edit Part" : "Add Part"}
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
            <Button type="submit">{editingPart ? "Save" : "Add Part"}</Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Part"
        message={`Are you sure you want to delete "${deleteTarget?.description}"? This action cannot be undone.`}
        loading={deleting}
      />
    </motion.div>
  );
}

export default function PartsPage() {
  return (
    <Suspense fallback={<div className="flex h-40 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
      <PartsContent />
    </Suspense>
  );
}
