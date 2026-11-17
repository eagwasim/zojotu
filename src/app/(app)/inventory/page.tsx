"use client";

import { Suspense, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Pencil, Trash2, Eye, Download, Receipt, X, ArrowDown, ArrowUp, ChevronsUpDown, LayoutGrid, Rows3, Watch as WatchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput, SegmentedFilter } from "@/components/ui/filter-bar";
import { TableSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { WatchFormSheet, type WatchRecord } from "@/components/watches/watch-form-sheet";
import { RecordSaleSheet } from "@/components/sales/record-sale-sheet";
import {
  BulkStageMenu,
  RowActionsMenu,
  StageMenu,
  type SettableStatus,
} from "@/components/inventory/watch-menus";
import { downloadWatchesCsv } from "@/components/inventory/watch-csv";
import { usePaginatedFetch, type SortParam } from "@/hooks/use-paginated-fetch";
import { ATTENTION, daysBetween } from "@/lib/dashboard/compute";
import { isoDate } from "@/components/ui/date-input";
import { apiDelete, apiPost, apiPut, apiRequest } from "@/lib/api-client";
import { WATCH_STATUSES } from "@/lib/validators/watch";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const errorMessage = (e: unknown, fallback: string) =>
  e instanceof Error && e.message ? e.message : fallback;

const watchLabel = (w: Pick<WatchRecord, "brand" | "model">) => `${w.brand} ${w.model}`;

const plural = (n: number) => `${n} watch${n === 1 ? "" : "es"}`;

const th = "border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground";

/** A row from GET /api/watches?page=…: the watch plus cost basis and cover photo. */
type ListWatch = WatchRecord & { costBasis: number; partsCost: number; coverImageId: number | null };

/** "In stock for N days" or "listed for N days"; flagged at the same thresholds as the dashboard. */
function ageOf(w: ListWatch, status: string) {
  if (status === "Sold") return null;
  const today = isoDate();
  if (status === "Listed" && w.listedDate) {
    const d = daysBetween(w.listedDate, today);
    return { days: d, label: `${d}d listed`, stale: d > ATTENTION.listedDays };
  }
  const d = daysBetween(w.acquisitionDate, today);
  const limit = status === "Modding" ? ATTENTION.moddingDays : ATTENTION.unlistedDays;
  return { days: d, label: `${d}d`, stale: d > limit };
}

function Thumb({ id, className }: { id: number | null; className?: string }) {
  if (!id) {
    return (
      <span aria-hidden className={cn("flex items-center justify-center rounded-md bg-secondary text-muted-foreground/60", className)}>
        <WatchIcon className="size-4" />
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element -- served by our own image API
  return <img src={`/api/images/${id}`} alt="" loading="lazy" className={cn("rounded-md object-cover outline-1 -outline-offset-1 outline-black/10", className)} />;
}

function SortHeader({
  label,
  sortKey,
  sort,
  onSort,
  align = "left",
  className,
  firstDirection = "asc",
}: {
  label: string;
  sortKey: string;
  sort: SortParam | null;
  onSort: (s: SortParam | null) => void;
  align?: "left" | "right";
  className?: string;
  firstDirection?: "asc" | "desc";
}) {
  const active = sort?.key === sortKey;
  const Icon = !active ? ChevronsUpDown : sort!.direction === "asc" ? ArrowUp : ArrowDown;
  const other = firstDirection === "asc" ? "desc" : "asc";
  const next = (): SortParam | null =>
    !active ? { key: sortKey, direction: firstDirection } : sort!.direction === firstDirection ? { key: sortKey, direction: other } : null;
  return (
    <th
      scope="col"
      aria-sort={active ? (sort!.direction === "asc" ? "ascending" : "descending") : undefined}
      className={cn(th, align === "right" ? "text-right" : "text-left", className)}
    >
      <button
        type="button"
        onClick={() => onSort(next())}
        className={cn(
          "-mx-1 inline-flex items-center gap-1 rounded px-1 py-0.5 hover:text-foreground",
          active && "text-foreground",
          align === "right" && "flex-row-reverse"
        )}
      >
        {label}
        <Icon className={cn("size-3.5", !active && "opacity-40")} aria-hidden />
      </button>
    </th>
  );
}

// List or grid, remembered per browser.
const VIEW_KEY = "inventory:view";
const subscribeView = (cb: () => void) => {
  window.addEventListener("storage", cb);
  window.addEventListener(VIEW_KEY, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(VIEW_KEY, cb);
  };
};
// Phones default to the photo grid (the table needs sideways scrolling there); an explicit choice wins.
const readView = (): "table" | "grid" => {
  const stored = localStorage.getItem(VIEW_KEY);
  if (stored === "grid" || stored === "table") return stored;
  return window.matchMedia("(max-width: 639px)").matches ? "grid" : "table";
};

function InventoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
    sort,
    setSort,
    meta,
    hasLoaded,
  } = usePaginatedFetch<ListWatch>({ url: "/api/watches" });

  const view = useSyncExternalStore(subscribeView, readView, () => "table" as const);
  const setView = (v: "table" | "grid") => {
    localStorage.setItem(VIEW_KEY, v);
    window.dispatchEvent(new Event(VIEW_KEY));
  };
  const counts = (meta.counts ?? {}) as Record<string, number>;
  const filtering = !!search || !!filters.status;

  const [searchInput, setSearchInput] = useState(search);
  const [formOpen, setFormOpen] = useState(false);
  const [editingWatch, setEditingWatch] = useState<WatchRecord | null>(null);
  const [saleWatch, setSaleWatch] = useState<ListWatch | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WatchRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  // Optimistic stage changes, shown until the list is refetched.
  const [stageOverrides, setStageOverrides] = useState<Record<number, string>>({});

  // The command palette and the global "N" shortcut link to /inventory?new=1.
  const newFromUrl = searchParams.get("new") === "1";
  const sheetOpen = formOpen || newFromUrl;

  const activeStatus = filters.status || "";
  const statusOf = (w: WatchRecord) => stageOverrides[w.id] ?? w.status;

  const pageIds = watches.map((w) => w.id);
  const selectedOnPage = pageIds.filter((id) => selected.has(id)).length;
  const allOnPageSelected = pageIds.length > 0 && selectedOnPage === pageIds.length;

  const openAdd = () => {
    setEditingWatch(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingWatch(null);
    if (newFromUrl) router.replace("/inventory");
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setSearch(value);
  };

  const toggleRow = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const togglePage = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of pageIds) {
        if (allOnPageSelected) next.delete(id);
        else next.add(id);
      }
      return next;
    });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiDelete(`/api/watches/${deleteTarget.id}`);
      toast("Watch deleted", "success");
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget.id);
        return next;
      });
      refresh();
    } catch (e) {
      toast(errorMessage(e, "Couldn't delete the watch"), "error");
    } finally {
      setDeleteTarget(null);
      setDeleting(false);
    }
  };

  const changeStage = async (watch: WatchRecord, status: SettableStatus) => {
    const clearOverride = () =>
      setStageOverrides((prev) => {
        const next = { ...prev };
        delete next[watch.id];
        return next;
      });
    setStageOverrides((prev) => ({ ...prev, [watch.id]: status }));
    try {
      await apiPut(`/api/watches/${watch.id}`, { status });
      await refresh();
      clearOverride();
    } catch (e) {
      clearOverride();
      toast(errorMessage(e, `Couldn't change the stage of ${watchLabel(watch)}`), "error");
    }
  };

  const bulkSetStage = async (status: SettableStatus) => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBulkBusy(true);
    try {
      const res = await apiPost<{ updatedIds: number[]; skipped: number }>(
        "/api/watches/bulk-status",
        { ids, status }
      );
      const updated = res.updatedIds.length;
      const msg =
        `Moved ${plural(updated)} to ${status}` +
        (res.skipped > 0
          ? `. Skipped ${res.skipped} sold watch${res.skipped === 1 ? "" : "es"}.`
          : "");
      toast(msg, updated > 0 ? "success" : "info");
      setSelected(new Set());
      refresh();
    } catch (e) {
      toast(errorMessage(e, "Couldn't update the stage"), "error");
    } finally {
      setBulkBusy(false);
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const all = await apiRequest<WatchRecord[]>("/api/watches");
      const rows = selected.size > 0 ? all.filter((w) => selected.has(w.id)) : all;
      if (rows.length === 0) {
        toast("There are no watches to export", "info");
        return;
      }
      downloadWatchesCsv(rows);
      toast(`Exported ${plural(rows.length)}`, "success");
    } catch (e) {
      toast(errorMessage(e, "Couldn't export watches"), "error");
    } finally {
      setExporting(false);
    }
  };

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description={`${plural(total)} in collection`}
        actions={
          <>
            <Button variant="secondary" onClick={exportCsv} disabled={exporting}>
              <Download />
              {exporting ? "Exporting…" : "Export CSV"}
            </Button>
            <Button onClick={openAdd}>
              <Plus />
              Add watch
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SearchInput
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search brand, model or reference…"
        />
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedFilter
            label="Stage"
            value={activeStatus}
            onChange={(status) => setFilter("status", status)}
            options={[
              { value: "", label: "All", count: counts.all },
              ...WATCH_STATUSES.map((s) => ({ value: s, label: s, count: counts[s] ?? 0 })),
            ]}
          />
          <div role="radiogroup" aria-label="Layout" className="inline-flex rounded-lg bg-secondary p-1">
            {([
              ["table", Rows3, "List"],
              ["grid", LayoutGrid, "Photo grid"],
            ] as const).map(([v, Icon, name]) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={view === v}
                aria-label={name}
                title={name}
                onClick={() => setView(v)}
                className={cn(
                  "flex h-7 w-8 items-center justify-center rounded-md transition-[background-color,color,box-shadow] duration-150",
                  view === v ? "bg-card text-foreground shadow-card" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {selected.size > 0 && (
        <div
          role="region"
          aria-label="Bulk actions"
          className="flex flex-wrap items-center gap-2 rounded-xl bg-card px-4 py-2.5 shadow-card"
        >
          <p className="mr-auto text-sm font-medium text-foreground" aria-live="polite">
            {selected.size} selected
          </p>
          <BulkStageMenu disabled={bulkBusy} onSelect={bulkSetStage} />
          <Button variant="secondary" size="sm" onClick={exportCsv} disabled={exporting}>
            <Download />
            Export CSV
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
            <X />
            Clear
          </Button>
        </div>
      )}

      {!hasLoaded ? (
        <TableSkeleton cols={7} />
      ) : watches.length === 0 ? (
        filtering ? (
          <EmptyState
            title="No watches match"
            description="Try a different search, or show all stages."
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  handleSearchChange("");
                  setFilter("status", "");
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={WatchIcon}
            title="No watches yet"
            description="Add the first watch you've bought. Press N from anywhere to add one quickly."
            action={
              <Button size="sm" onClick={openAdd}>
                <Plus />
                Add watch
              </Button>
            }
          />
        )
      ) : (
        <>
          <div aria-busy={loading} className={cn("transition-opacity duration-150", loading && "opacity-60")}>
            {view === "grid" ? (
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {watches.map((watch) => {
                  const status = statusOf(watch);
                  const age = ageOf(watch, status);
                  return (
                    <li key={watch.id}>
                      <Link
                        href={`/inventory/${watch.id}`}
                        className="group flex h-full flex-col overflow-hidden rounded-xl bg-card shadow-card transition-[box-shadow,translate] duration-150 hover:-translate-y-0.5 hover:shadow-raised"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                          {watch.coverImageId ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={`/api/images/${watch.coverImageId}`}
                              alt=""
                              loading="lazy"
                              className="size-full object-cover transition-[scale] duration-300 group-hover:scale-[1.03]"
                            />
                          ) : (
                            <span className="flex size-full items-center justify-center text-muted-foreground/50">
                              <WatchIcon className="size-8" aria-hidden />
                            </span>
                          )}
                          <span className="absolute left-2 top-2">
                            <StatusBadge status={status} className="bg-card/90 backdrop-blur" />
                          </span>
                        </div>
                        <div className="flex flex-1 flex-col gap-1 p-3">
                          <span className="truncate text-xs text-muted-foreground">{watch.brand}</span>
                          <span className="truncate text-sm font-medium text-foreground">{watch.model}</span>
                          <span className="mt-auto flex items-baseline justify-between pt-2 text-xs tabular-nums">
                            <span className="text-foreground">
                              {watch.askingPrice ? formatCurrency(watch.askingPrice) : formatCurrency(watch.costBasis)}
                              <span className="ml-1 text-muted-foreground">{watch.askingPrice ? "ask" : "cost"}</span>
                            </span>
                            {age && (
                              <span className={cn("text-muted-foreground", age.stale && "font-medium text-warning-ink")}>
                                {age.label}
                              </span>
                            )}
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="overflow-x-auto rounded-xl bg-card shadow-card">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th scope="col" className={cn(th, "w-10 pr-0")}>
                        <input
                          type="checkbox"
                          aria-label="Select all watches on this page"
                          checked={allOnPageSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = selectedOnPage > 0 && !allOnPageSelected;
                          }}
                          onChange={togglePage}
                          className="size-4 align-middle accent-[var(--primary)]"
                        />
                      </th>
                      <SortHeader label="Watch" sortKey="brand" sort={sort} onSort={setSort} />
                      <th scope="col" className={cn(th, "text-left")}>Stage</th>
                      <SortHeader label="Cost" sortKey="cost" sort={sort} onSort={setSort} align="right" firstDirection="desc" />
                      <SortHeader label="Asking" sortKey="asking" sort={sort} onSort={setSort} align="right" firstDirection="desc" className="hidden md:table-cell" />
                      <SortHeader label="Age" sortKey="acquired" sort={sort} onSort={setSort} align="right" className="hidden sm:table-cell" />
                      <th scope="col" className={cn(th, "hidden text-left lg:table-cell")}>Bought from</th>
                      <th scope="col" className={cn(th, "text-right")}>
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {watches.map((watch) => {
                      const label = watchLabel(watch);
                      const status = statusOf(watch);
                      const isSelected = selected.has(watch.id);
                      const isSold = status === "Sold";
                      const age = ageOf(watch, status);
                      return (
                        <tr
                          key={watch.id}
                          onClick={() => router.push(`/inventory/${watch.id}`)}
                          className={cn(
                            "cursor-pointer border-t border-border transition-colors first:border-t-0 hover:bg-accent/50",
                            isSelected && "bg-accent/60"
                          )}
                        >
                          <td className="w-10 py-3 pl-4 pr-0" onClick={stop}>
                            <input
                              type="checkbox"
                              aria-label={`Select ${label}`}
                              checked={isSelected}
                              onChange={() => toggleRow(watch.id)}
                              className="size-4 align-middle accent-[var(--primary)]"
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            <Link
                              href={`/inventory/${watch.id}`}
                              onClick={stop}
                              className="flex items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                            >
                              <Thumb id={watch.coverImageId} className="size-10 shrink-0" />
                              <span className="min-w-0">
                                <span className="block truncate font-medium text-foreground">{watch.brand}</span>
                                <span className="block truncate text-xs text-muted-foreground">
                                  {watch.model}
                                  {watch.reference ? ` · ${watch.reference}` : ""}
                                </span>
                              </span>
                            </Link>
                          </td>
                          <td className="px-4 py-3" onClick={stop}>
                            {isSold ? (
                              <StatusBadge status={status} />
                            ) : (
                              <StageMenu status={status} label={label} onChange={(s) => changeStage(watch, s)} />
                            )}
                          </td>
                          <td
                            className="px-4 py-3 text-right tabular-nums text-foreground"
                            title={watch.partsCost ? `${formatCurrency(watch.baseCost)} + ${formatCurrency(watch.partsCost)} parts` : undefined}
                          >
                            {formatCurrency(watch.costBasis)}
                          </td>
                          <td className="hidden px-4 py-3 text-right tabular-nums md:table-cell">
                            {watch.askingPrice ? (
                              formatCurrency(watch.askingPrice)
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="hidden px-4 py-3 text-right tabular-nums sm:table-cell" title={`Acquired ${formatDate(watch.acquisitionDate)}`}>
                            {age ? (
                              <span className={cn("text-muted-foreground", age.stale && "font-medium text-warning-ink")}>
                                {age.label}
                                {age.stale && <span className="sr-only"> (a long time)</span>}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{watch.source}</td>
                          <td className="px-4 py-2 text-right" onClick={stop}>
                            <RowActionsMenu
                              label={label}
                              actions={[
                                { label: "Open", icon: Eye, onSelect: () => router.push(`/inventory/${watch.id}`) },
                                {
                                  label: "Edit",
                                  icon: Pencil,
                                  onSelect: () => {
                                    setEditingWatch(watch);
                                    setFormOpen(true);
                                  },
                                },
                                ...(isSold
                                  ? []
                                  : [{ label: "Record sale", icon: Receipt, onSelect: () => setSaleWatch(watch) }]),
                                { label: "Delete", icon: Trash2, destructive: true, onSelect: () => setDeleteTarget(watch) },
                              ]}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <Pagination page={page} totalPages={totalPages} total={total} pageSize={20} onPageChange={setPage} />
        </>
      )}

      <WatchFormSheet
        open={sheetOpen}
        onClose={closeForm}
        watch={editingWatch}
        onSaved={() => refresh()}
      />

      <RecordSaleSheet
        open={!!saleWatch}
        onClose={() => setSaleWatch(null)}
        watch={
          saleWatch && {
            id: saleWatch.id,
            label: watchLabel(saleWatch),
            costBasis: saleWatch.costBasis,
            askingPrice: saleWatch.askingPrice,
            listedPlatform: saleWatch.listedPlatform,
          }
        }
        onSaved={() => refresh()}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete watch"
        message={`Are you sure you want to delete "${deleteTarget ? watchLabel(deleteTarget) : ""}"? This will also remove all associated parts and sales records. This action cannot be undone.`}
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
