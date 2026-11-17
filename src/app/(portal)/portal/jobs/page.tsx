"use client";

import { Suspense, useState } from "react";
import { Eye, Watch } from "lucide-react";
import Link from "next/link";
import { Pagination } from "@/components/ui/pagination";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchInput } from "@/components/ui/filter-bar";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/skeleton";
import { usePaginatedFetch } from "@/hooks/use-paginated-fetch";
import { formatCurrency, formatDate } from "@/lib/utils";
import { iconButtonClasses } from "@/components/ui/icon-button";

interface ServiceJob {
  id: number;
  watchBrand: string;
  watchModel: string;
  status: string;
  estimatedCost: number | null;
  finalCost: number | null;
  createdAt: string;
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
  Shipped: "info",
  Received: "info",
  Diagnosed: "info",
  "In Progress": "info",
  Completed: "good",
  Collected: "neutral",
  Refused: "critical",
  Rejected: "critical",
  Cancelled: "critical",
};

function JobsListContent() {
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
  } = usePaginatedFetch<ServiceJob>({ url: "/api/service-jobs" });

  const [searchInput, setSearchInput] = useState(search);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setSearch(value);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My service jobs"
        description={`${total} job${total !== 1 ? "s" : ""} total`}
        actions={
          <Link href="/portal/jobs/new" className={buttonClasses()}>
            Request service
          </Link>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search by watch…"
        />
        <div className="w-full sm:w-48">
          <Select
            aria-label="Filter by status"
            value={filters.status || ""}
            onChange={(e) => setFilter("status", e.target.value)}
            placeholder="All statuses"
            options={STATUSES.map((st) => ({ value: st, label: st }))}
          />
        </div>
      </div>

      {loading ? (
        <TableSkeleton cols={5} />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Watch}
          title="No service jobs yet"
          description="Request a service to send us your watch. Your jobs will be listed here."
          action={
            <Link href="/portal/jobs/new" className={buttonClasses({ variant: "secondary", size: "sm" })}>
              Request your first service
            </Link>
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl bg-card shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground text-left">Watch</th>
                  <th className="border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground text-left">Status</th>
                  <th className="border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground text-right">Cost</th>
                  <th className="border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground text-left">Submitted</th>
                  <th className="border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground text-right"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                  {jobs.map((job) => (
                    <tr
                      key={job.id}
                      className="border-t border-border transition-colors hover:bg-accent/50"
                    >
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
                            : "TBD"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(job.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/portal/jobs/${job.id}`}
                            aria-label={`View ${job.watchBrand} ${job.watchModel}`}
                            title="View job"
                            className={iconButtonClasses()}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
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
    </div>
  );
}

export default function PortalJobsPage() {
  return (
    <Suspense fallback={<TableSkeleton cols={5} />}>
      <JobsListContent />
    </Suspense>
  );
}
