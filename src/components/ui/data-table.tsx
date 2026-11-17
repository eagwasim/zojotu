"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "./skeleton";

export type SortDirection = "asc" | "desc";
export interface SortState {
  key: string;
  direction: SortDirection;
}

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  /** Numbers and money: right-aligned, tabular. */
  align?: "left" | "right" | "center";
  /** Enables sorting. Return the value to compare (client sort) or just `true` for server sort. */
  sortValue?: (row: T) => string | number | null | undefined;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
  /** Hide below this breakpoint to keep the table usable on a phone. */
  hideBelow?: "sm" | "md" | "lg";
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string | number;
  loading?: boolean;
  /** Rendered instead of the table when there are no rows. */
  empty?: React.ReactNode;
  onRowClick?: (row: T) => void;
  /** Accessible label for the row-click action, e.g. (row) => `Open ${row.brand}`. */
  rowLabel?: (row: T) => string;
  /** Controlled sort (server-side). If omitted, sorting happens on the client. */
  sort?: SortState | null;
  onSortChange?: (sort: SortState | null) => void;
  /** Row selection for bulk actions. */
  selectable?: boolean;
  selectedIds?: Set<string | number>;
  onSelectedIdsChange?: (ids: Set<string | number>) => void;
  density?: "comfortable" | "compact";
  caption?: string;
  className?: string;
}

const hide = { sm: "hidden sm:table-cell", md: "hidden md:table-cell", lg: "hidden lg:table-cell" };
const alignClass = { left: "text-left", right: "text-right tabular-nums", center: "text-center" };

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  loading,
  empty,
  onRowClick,
  rowLabel,
  sort: controlledSort,
  onSortChange,
  selectable,
  selectedIds,
  onSelectedIdsChange,
  density = "comfortable",
  caption,
  className,
}: DataTableProps<T>) {
  const [localSort, setLocalSort] = useState<SortState | null>(null);
  const isControlled = controlledSort !== undefined;
  const sort = isControlled ? controlledSort : localSort;

  const sortedRows = useMemo(() => {
    if (isControlled || !sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const dir = sort.direction === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = col.sortValue!(a);
      const vb = col.sortValue!(b);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb), undefined, { numeric: true }) * dir;
    });
  }, [rows, columns, sort, isControlled]);

  const toggleSort = (key: string) => {
    const next: SortState | null =
      !sort || sort.key !== key
        ? { key, direction: "asc" }
        : sort.direction === "asc"
          ? { key, direction: "desc" }
          : null;
    if (!isControlled) setLocalSort(next);
    onSortChange?.(next);
  };

  if (loading) return <TableSkeleton cols={Math.min(columns.length, 6)} />;
  if (rows.length === 0 && empty) return <>{empty}</>;

  const selected = selectedIds ?? new Set<string | number>();
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(getRowId(r)));
  const someSelected = !allSelected && rows.some((r) => selected.has(getRowId(r)));
  const setSelected = (ids: Set<string | number>) => onSelectedIdsChange?.(ids);

  const cellPad = density === "compact" ? "px-4 py-2" : "px-4 py-3";

  return (
    <div className={cn("overflow-x-auto rounded-xl bg-card shadow-card", className)}>
      <table className="w-full text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="sticky top-0 z-[1] bg-card">
          <tr className="border-b border-border">
            {selectable && (
              <th scope="col" className="w-10 pl-4">
                <input
                  type="checkbox"
                  aria-label="Select all rows"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={() =>
                    setSelected(allSelected ? new Set() : new Set(rows.map(getRowId)))
                  }
                  className="size-4 accent-[var(--primary)]"
                />
              </th>
            )}
            {columns.map((col) => {
              const canSort = col.sortable || !!col.sortValue;
              const active = sort?.key === col.key;
              const SortIcon = !active ? ChevronsUpDown : sort!.direction === "asc" ? ArrowUp : ArrowDown;
              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={active ? (sort!.direction === "asc" ? "ascending" : "descending") : undefined}
                  className={cn(
                    "px-4 py-2.5 text-xs font-medium text-muted-foreground",
                    alignClass[col.align ?? "left"],
                    col.hideBelow && hide[col.hideBelow],
                    col.headerClassName
                  )}
                >
                  {canSort ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className={cn(
                        "-mx-1 inline-flex items-center gap-1 rounded px-1 py-0.5 hover:text-foreground",
                        active && "text-foreground",
                        col.align === "right" && "flex-row-reverse"
                      )}
                    >
                      {col.header}
                      <SortIcon className={cn("size-3.5", !active && "opacity-40")} aria-hidden />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => {
            const id = getRowId(row);
            const isSelected = selected.has(id);
            return (
              <tr
                key={id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "border-b border-border transition-colors duration-100 last:border-0",
                  onRowClick && "cursor-pointer hover:bg-accent/50",
                  isSelected && "bg-accent/60"
                )}
              >
                {selectable && (
                  <td className="w-10 pl-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      aria-label={rowLabel ? `Select ${rowLabel(row)}` : "Select row"}
                      checked={isSelected}
                      onChange={() => {
                        const next = new Set(selected);
                        if (isSelected) next.delete(id);
                        else next.add(id);
                        setSelected(next);
                      }}
                      className="size-4 accent-[var(--primary)]"
                    />
                  </td>
                )}
                {columns.map((col, i) => (
                  <td
                    key={col.key}
                    className={cn(
                      cellPad,
                      alignClass[col.align ?? "left"],
                      col.hideBelow && hide[col.hideBelow],
                      col.className
                    )}
                  >
                    {i === 0 && onRowClick && rowLabel ? (
                      // Keyboard path to the row action; the row itself handles mouse clicks.
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRowClick(row);
                        }}
                        aria-label={rowLabel(row)}
                        className="w-full rounded text-left outline-offset-4"
                      >
                        {col.cell(row)}
                      </button>
                    ) : (
                      col.cell(row)
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
