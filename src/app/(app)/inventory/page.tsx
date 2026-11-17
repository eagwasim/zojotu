"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Pencil, Trash2, Eye, Download, Receipt, X } from "lucide-react";
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
import { usePaginatedFetch } from "@/hooks/use-paginated-fetch";
import { apiDelete, apiPost, apiPut, apiRequest } from "@/lib/api-client";
import { WATCH_STATUSES } from "@/lib/validators/watch";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const errorMessage = (e: unknown, fallback: string) =>
  e instanceof Error && e.message ? e.message : fallback;

const watchLabel = (w: Pick<WatchRecord, "brand" | "model">) => `${w.brand} ${w.model}`;

const plural = (n: number) => `${n} watch${n === 1 ? "" : "es"}`;

const th = "border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground";

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
  } = usePaginatedFetch<WatchRecord>({ url: "/api/watches" });

  const [searchInput, setSearchInput] = useState(search);
  const [formOpen, setFormOpen] = useState(false);
  const [editingWatch, setEditingWatch] = useState<WatchRecord | null>(null);
  const [saleWatch, setSaleWatch] = useState<WatchRecord | null>(null);
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search brand or model…"
        />
        <SegmentedFilter
          label="Status"
          value={activeStatus}
          onChange={(status) => setFilter("status", status)}
          options={[
            { value: "", label: "All" },
            ...WATCH_STATUSES.map((s) => ({ value: s, label: s })),
          ]}
        />
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

      {loading && watches.length === 0 ? (
        <TableSkeleton cols={7} />
      ) : watches.length === 0 ? (
        <EmptyState
          title="No watches found"
          description="Add a watch to start tracking your collection, or clear the search and status filter."
          action={
            <Button variant="secondary" size="sm" onClick={openAdd}>
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
                  <th scope="col" className={cn(th, "text-left")}>Watch</th>
                  <th scope="col" className={cn(th, "hidden text-left md:table-cell")}>Movement</th>
                  <th scope="col" className={cn(th, "hidden text-left md:table-cell")}>Source</th>
                  <th scope="col" className={cn(th, "text-right")}>Cost</th>
                  <th scope="col" className={cn(th, "text-left")}>Status</th>
                  <th scope="col" className={cn(th, "hidden text-left lg:table-cell")}>Date</th>
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
                      <td className="px-4 py-3">
                        <Link
                          href={`/inventory/${watch.id}`}
                          onClick={stop}
                          className="block rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                          <span className="block font-medium text-foreground">{watch.brand}</span>
                          <span className="block text-xs text-muted-foreground">{watch.model}</span>
                        </Link>
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                        {watch.movementType}
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                        {watch.source}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-foreground">
                        {formatCurrency(watch.baseCost)}
                      </td>
                      <td className="px-4 py-3" onClick={stop}>
                        {isSold ? (
                          <StatusBadge status={status} />
                        ) : (
                          <StageMenu
                            status={status}
                            label={label}
                            onChange={(s) => changeStage(watch, s)}
                          />
                        )}
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                        {formatDate(watch.acquisitionDate)}
                      </td>
                      <td className="px-4 py-2 text-right" onClick={stop}>
                        <RowActionsMenu
                          label={label}
                          actions={[
                            {
                              label: "Open",
                              icon: Eye,
                              onSelect: () => router.push(`/inventory/${watch.id}`),
                            },
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
                              : [
                                  {
                                    label: "Record sale",
                                    icon: Receipt,
                                    onSelect: () => setSaleWatch(watch),
                                  },
                                ]),
                            {
                              label: "Delete",
                              icon: Trash2,
                              destructive: true,
                              onSelect: () => setDeleteTarget(watch),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
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
