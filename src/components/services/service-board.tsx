"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency } from "@/lib/utils";

export interface BoardJob {
  id: number;
  watchBrand: string;
  watchModel: string;
  status: string;
  estimatedCost: number | null;
  finalCost: number | null;
  isPaid: number;
  createdAt: string;
  customerName: string;
}

/** Open jobs grouped by what has to happen next. Closed jobs (Collected, Refused) stay in the list view. */
const COLUMNS: { title: string; hint: string; statuses: string[]; tone: BadgeTone }[] = [
  { title: "Waiting for reply", hint: "Accept or refuse", statuses: ["Pending"], tone: "warning" },
  { title: "On its way", hint: "Accepted, waiting for the watch", statuses: ["Accepted", "Shipped"], tone: "info" },
  { title: "In the workshop", hint: "Received and being worked on", statuses: ["Received", "Diagnosed", "In Progress"], tone: "info" },
  { title: "Ready to collect", hint: "Done, waiting for pickup or payment", statuses: ["Completed"], tone: "good" },
];

const daysAgo = (iso: string) => Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000));

export function ServiceBoard({ search }: { search: string }) {
  const [jobs, setJobs] = useState<BoardJob[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    const qs = new URLSearchParams({ page: "1", pageSize: "500" });
    if (search) qs.set("search", search);
    fetch(`/api/service-jobs?${qs}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Couldn't load service jobs"))))
      .then((res) => {
        setJobs(res.data ?? []);
        setError(null);
      })
      .catch((e) => !ctrl.signal.aborted && setError(e.message));
    return () => ctrl.abort();
  }, [search]);

  if (error) return <p role="alert" className="rounded-lg bg-critical-wash px-4 py-3 text-sm text-critical-ink">{error}</p>;
  if (!jobs) {
    return (
      <div role="status" aria-label="Loading board" className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((c) => (
          <Skeleton key={c.title} className="h-64 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {COLUMNS.map((col) => {
        const items = jobs
          .filter((j) => col.statuses.includes(j.status))
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt)); // oldest first: it has waited longest
        return (
          <section key={col.title} aria-label={col.title} className="flex flex-col gap-3 rounded-xl bg-secondary/60 p-3">
            <header className="flex items-baseline justify-between px-1">
              <div>
                <h2 className="text-sm font-semibold text-foreground">{col.title}</h2>
                <p className="text-xs text-muted-foreground">{col.hint}</p>
              </div>
              <span className="text-sm tabular-nums text-muted-foreground">{items.length}</span>
            </header>
            {items.length === 0 ? (
              <p className="rounded-lg border border-dashed border-input/80 px-3 py-6 text-center text-xs text-muted-foreground">
                Nothing here
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {items.map((j) => {
                  const price = j.finalCost ?? j.estimatedCost;
                  const age = daysAgo(j.createdAt);
                  const unpaid = j.status === "Completed" && !j.isPaid && (j.finalCost ?? 0) > 0;
                  return (
                    <li key={j.id}>
                      <Link
                        href={`/services/${j.id}`}
                        className="flex flex-col gap-2 rounded-lg bg-card p-3 shadow-card transition-[box-shadow,translate] duration-150 hover:-translate-y-0.5 hover:shadow-raised"
                      >
                        <span className="flex items-start justify-between gap-2">
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-foreground">
                              {j.watchBrand} {j.watchModel}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">{j.customerName}</span>
                          </span>
                          {col.statuses.length > 1 && <Badge tone={col.tone} className="shrink-0">{j.status}</Badge>}
                        </span>
                        <span className="flex items-center justify-between text-xs tabular-nums">
                          <span className={cn("text-muted-foreground", col.title === "Waiting for reply" && age > 2 && "font-medium text-warning-ink")}>
                            {age === 0 ? "Today" : `${age}d ago`}
                          </span>
                          <span className="flex items-center gap-2">
                            {unpaid && <Badge tone="warning">Unpaid</Badge>}
                            {price !== null && (
                              <span className="text-foreground">
                                {formatCurrency(price)}
                                {j.finalCost === null && <span className="ml-1 text-muted-foreground">est.</span>}
                              </span>
                            )}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
