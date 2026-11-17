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
import { CurrencyInput } from "@/components/ui/currency-input";
import { DateInput } from "@/components/ui/date-input";
import { CreatableCombobox } from "@/components/ui/creatable-combobox";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { usePaginatedFetch } from "@/hooks/use-paginated-fetch";
import {
  invalidateSuggestions,
  serverFieldErrors,
  useSuggestions,
  withoutKey,
} from "@/hooks/use-form-data";
import { apiPost, apiPut, apiDelete, ApiError } from "@/lib/api-client";
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

// Remembered for this browser session so a run of similar parts is quick to enter.
const LAST_CATEGORY_KEY = "parts:last-category";

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
  const suppliers = useSuggestions("supplier");
  // Description and cost are controlled so "Save & add another" can clear just those.
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState<number | null>(null);
  const [defaultCategory, setDefaultCategory] = useState<string | undefined>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const openForm = (part: Part | null) => {
    setEditingPart(part);
    setDescription(part?.description ?? "");
    setCost(part?.cost ?? null);
    setDefaultCategory(part ? part.category : lastCategory());
    setErrors({});
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingPart(null);
  };

  const clearError = (key: string) => {
    if (errors[key]) setErrors((prev) => withoutKey(prev, key));
  };

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
    } catch (e) {
      toast(errorMessage(e, "Failed to delete part"), "error");
    } finally {
      setDeleteTarget(null);
      setDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const another = !editingPart && submitter?.value === "another";
    const formData = new FormData(e.currentTarget);
    const watchId = parseInt(formData.get("watchId") as string);
    const supplier = ((formData.get("supplier") as string) || "").trim();
    const data = {
      watchId,
      date: formData.get("date") as string,
      description: description.trim(),
      category: formData.get("category") as string,
      cost: cost ?? NaN,
      // On edit, an empty string clears the supplier; on create, leave it out.
      supplier: editingPart ? supplier : supplier || undefined,
    };

    const local: Record<string, string> = {};
    if (!Number.isFinite(watchId)) local.watchId = "Choose a watch";
    if (!data.description) local.description = "Description is required";
    if (cost === null) local.cost = "Enter what the part cost";
    if (Object.keys(local).length > 0) {
      setErrors(local);
      return;
    }

    setSaving(true);
    try {
      if (editingPart) {
        await apiPut(`/api/parts/${editingPart.id}`, data);
        toast("Part updated", "success");
      } else {
        await apiPost("/api/parts", data);
        toast("Part added", "success");
        try {
          sessionStorage.setItem(LAST_CATEGORY_KEY, data.category);
        } catch {}
      }
      invalidateSuggestions();
      refresh();
      if (another) {
        // Keep watch, date, supplier and category; clear what differs per part.
        setDescription("");
        setCost(null);
        setErrors({});
        requestAnimationFrame(() =>
          document.querySelector<HTMLInputElement>("#part-description")?.focus()
        );
      } else {
        closeForm();
      }
    } catch (e) {
      const fe = e instanceof ApiError ? serverFieldErrors(e.body) : {};
      setErrors(fe);
      toast(
        Object.keys(fe).length > 0 ? "Check the highlighted fields" : errorMessage(e, "Failed to save part"),
        "error"
      );
    } finally {
      setSaving(false);
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
          <Button onClick={() => openForm(null)}>
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
            <Button variant="secondary" size="sm" onClick={() => openForm(null)}>
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
                          onClick={() => openForm(part)}
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
        onClose={closeForm}
        title={editingPart ? "Edit part" : "Add part"}
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Combobox
            label="Watch"
            name="watchId"
            defaultValue={editingPart?.watchId?.toString()}
            fetchUrl="/api/watches/search"
            placeholder="Search for a watch..."
            error={errors.watchId}
            onChange={() => clearError("watchId")}
          />
          <Input
            id="part-description"
            label="Description"
            name="description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              clearError("description");
            }}
            placeholder="e.g. Sapphire crystal"
            error={errors.description}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              name="category"
              defaultValue={defaultCategory}
              placeholder={false}
              options={CATEGORIES.map((c) => ({ value: c, label: c }))}
              error={errors.category}
              onChange={() => clearError("category")}
            />
            <CurrencyInput
              label="Cost"
              name="cost"
              value={cost}
              onValueChange={(v) => {
                setCost(v);
                clearError("cost");
              }}
              error={errors.cost}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <DateInput
              label="Date"
              name="date"
              defaultValue={editingPart?.date}
              error={errors.date}
              onValueChange={() => clearError("date")}
              required
            />
            <CreatableCombobox
              label="Supplier"
              name="supplier"
              suggestions={suppliers}
              defaultValue={editingPart?.supplier || ""}
              placeholder="Optional"
              error={errors.supplier}
              onValueChange={() => clearError("supplier")}
            />
          </div>
          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={closeForm}>
              Cancel
            </Button>
            {!editingPart && (
              <Button type="submit" name="intent" value="another" variant="secondary" disabled={saving}>
                Save & add another
              </Button>
            )}
            <Button type="submit" disabled={saving}>
              {editingPart ? "Save changes" : "Add part"}
            </Button>
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
