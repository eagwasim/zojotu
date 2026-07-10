"use client";

import { Suspense, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Search } from "lucide-react";
import Link from "next/link";
import { Pagination } from "@/components/ui/pagination";
import { usePaginatedFetch } from "@/hooks/use-paginated-fetch";
import { formatCurrency, formatDate } from "@/lib/utils";

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

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-yellow-500/10 text-yellow-500",
  Accepted: "bg-blue-500/10 text-blue-500",
  Refused: "bg-red-500/10 text-red-500",
  Shipped: "bg-indigo-500/10 text-indigo-500",
  Received: "bg-purple-500/10 text-purple-500",
  Diagnosed: "bg-cyan-500/10 text-cyan-500",
  "In Progress": "bg-amber-500/10 text-amber-500",
  Completed: "bg-green-500/10 text-green-500",
  Collected: "bg-zinc-500/10 text-zinc-500",
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Service Jobs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total} job{total !== 1 ? "s" : ""} total
        </p>
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-card p-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by watch..."
            className="w-full rounded-md border border-input bg-background py-2 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:max-w-md">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
            <select
              value={filters.status || ""}
              onChange={(e) => setFilter("status", e.target.value)}
              className="block w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-border">
          <p className="text-sm text-muted-foreground">No service jobs yet</p>
          <Link href="/portal/jobs/new" className="mt-2 text-sm font-medium text-primary hover:underline">
            Request your first service
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Watch</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cost</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Submitted</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">View</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {jobs.map((job) => (
                    <motion.tr
                      key={job.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-t border-border transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {job.watchBrand} {job.watchModel}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[job.status] || ""}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-foreground">
                        {job.finalCost
                          ? formatCurrency(job.finalCost)
                          : job.estimatedCost
                            ? `~${formatCurrency(job.estimatedCost)}`
                            : "TBD"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(job.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/portal/jobs/${job.id}`}
                          className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                          <Eye className="inline h-4 w-4" />
                        </Link>
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
    </motion.div>
  );
}

export default function PortalJobsPage() {
  return (
    <Suspense fallback={<div className="flex h-40 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
      <JobsListContent />
    </Suspense>
  );
}
