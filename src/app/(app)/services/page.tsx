"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Suspense, useState } from "react";
import { Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { IconButton, iconButtonClasses } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/filter-bar";
import { TableSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { usePaginatedFetch } from "@/hooks/use-paginated-fetch";
import { apiDelete } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ServiceBoard } from "@/components/services/service-board";

interface ServiceJob {
  id: number;
  customerId: number;
  watchBrand: string;
  watchModel: string;
  status: string;
  estimatedCost: number | null;
  finalCost: number | null;
  isPaid: number;
  createdAt: string;
  customerName: string;
  customerEmail: string;
}

const STATUSES = [
  "Pending",
  "Accepted",
  "Refused",
  "Shipped",
  "Received",
  "Diagnosed",
  "In Progress",
  "Completed",
  "Collected",
];

const STATUS_TONE: Record<string, BadgeTone> = {
  Pending: "warning",
  Accepted: "info",
  Refused: "critical",
  Shipped: "info",
  Received: "info",
  Diagnosed: "info",
  "In Progress": "info",
  Completed: "good",
  Collected: "neutral",
};

function ServicesContent() {
  const { toast } = useToast();
  const {
    data: jobs,
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
  } = usePaginatedFetch<ServiceJob>({ url: "/api/service-jobs", ignoreParams: ["new", "view"] });
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const view = params.get("view") === "board" ? "board" : "list";
  const setView = (v: "list" | "board") => {
    const sp = new URLSearchParams(params.toString());
    if (v === "board") sp.set("view", "board");
    else sp.delete("view");
    sp.delete("page");
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  };

  const [searchInput, setSearchInput] = useState(search);
  const [deleteTarget, setDeleteTarget] = useState<ServiceJob | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setSearch(value);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiDelete(`/api/service-jobs/${deleteTarget.id}`);
      toast("Service job deleted", "success");
      refresh();
    } catch (e: any) {
      toast(e.message || "Failed to delete", "error");
    } finally {
      setDeleteTarget(null);
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service jobs"
        description={view === "board" ? "Open jobs by what needs to happen next." : `${total} job${total !== 1 ? "s" : ""} total`}
        actions={
          <div role="radiogroup" aria-label="Layout" className="inline-flex rounded-lg bg-secondary p-1">
            {(["list", "board"] as const).map((v) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={view === v}
                onClick={() => setView(v)}
                className={
                  "h-7 rounded-md px-3 text-xs font-medium capitalize transition-[background-color,color,box-shadow] duration-150 " +
                  (view === v ? "bg-card text-foreground shadow-card" : "text-muted-foreground hover:text-foreground")
                }
              >
                {v}
              </button>
            ))}
          </div>
        }
      />

      {view === "board" ? (
        <div className="space-y-4">
          <SearchInput value={searchInput} onChange={handleSearchChange} placeholder="Search by watch brand or model…" />
          <ServiceBoard search={search} />
        </div>
      ) : (
        <>
      <div className="space-y-3">
        <SearchInput
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search by watch brand or model…"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Select
            label="Status"
            value={filters.status || ""}
            onChange={(e) => setFilter("status", e.target.value)}
            placeholder="All"
            options={STATUSES.map((s) => ({ value: s, label: s }))}
          />
          <Input
            label="From"
            type="date"
            value={filters.dateFrom || ""}
            onChange={(e) => setFilter("dateFrom", e.target.value)}
          />
          <Input
            label="To"
            type="date"
            value={filters.dateTo || ""}
            onChange={(e) => setFilter("dateTo", e.target.value)}
          />
          <Select
            label="Sort by"
            value={filters.sortBy || ""}
            onChange={(e) => setFilter("sortBy", e.target.value)}
            placeholder={false}
            options={[
              { value: "createdAt", label: "Date added" },
              { value: "status", label: "Status" },
              { value: "watchBrand", label: "Brand" },
              { value: "estimatedCost", label: "Est. cost" },
              { value: "finalCost", label: "Final cost" },
            ]}
          />
          <Select
            label="Order"
            value={filters.sortOrder || ""}
            onChange={(e) => setFilter("sortOrder", e.target.value)}
            placeholder={false}
            options={[
              { value: "desc", label: "Newest first" },
              { value: "asc", label: "Oldest first" },
            ]}
          />
        </div>
      </div>

      {loading ? (
        <TableSkeleton cols={7} />
      ) : jobs.length === 0 ? (
        <EmptyState
          title="No service jobs yet"
          description="Service jobs appear here when customers submit a request from the portal. Clear the filters if you expected to see some."
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl bg-card shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground text-left">Customer</th>
                  <th className="border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground text-left">Watch</th>
                  <th className="border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground text-left">Status</th>
                  <th className="border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground text-right">Cost</th>
                  <th className="border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground text-left">Payment</th>
                  <th className="border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground text-left">Date</th>
                  <th className="border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="border-t border-border transition-colors first:border-t-0 hover:bg-accent/50"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{job.customerName}</p>
                      <p className="text-xs text-muted-foreground">{job.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {job.watchBrand} {job.watchModel}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[job.status] ?? "neutral"}>{job.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">
                      {job.finalCost
                        ? formatCurrency(job.finalCost)
                        : job.estimatedCost
                          ? `~${formatCurrency(job.estimatedCost)}`
                          : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={job.isPaid ? "good" : "warning"}>
                        {job.isPaid ? "Paid" : "Unpaid"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(job.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/services/${job.id}`}
                          aria-label={`View job for ${job.watchBrand} ${job.watchModel}`}
                          title="View job"
                          className={iconButtonClasses()}
                        >
                          <Eye className="size-4" />
                        </Link>
                        <IconButton
                          tone="destructive"
                          aria-label={`Delete job for ${job.watchBrand} ${job.watchModel}`}
                          onClick={() => setDeleteTarget(job)}
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

        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete service job"
        message="Are you sure you want to delete this service job? This action cannot be undone."
        loading={deleting}
      />
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<TableSkeleton cols={7} />}>
      <ServicesContent />
    </Suspense>
  );
}
