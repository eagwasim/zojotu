"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, Clock, CheckCircle2, Watch, Wrench, Package, Bell } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

interface JobSummary {
  id: number;
  watchBrand: string;
  watchModel: string;
  status: string;
  createdAt: string;
}

interface DashboardStats {
  total: number;
  active: number;
  completed: number;
  pending: number;
  unreadNotifications: number;
}

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

export default function PortalDashboard() {
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    active: 0,
    completed: 0,
    pending: 0,
    unreadNotifications: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/service-jobs?page=1&pageSize=100").then((r) => r.json()),
      fetch("/api/notifications?page=1&pageSize=1").then((r) => r.json()),
    ])
      .then(([jobsRes, notifRes]) => {
        const allJobs = jobsRes.data || [];
        setJobs(allJobs.slice(0, 5));
        setStats({
          total: jobsRes.total || 0,
          active: allJobs.filter(
            (j: any) => !["Collected", "Refused", "Completed"].includes(j.status)
          ).length,
          completed: allJobs.filter(
            (j: any) => j.status === "Completed" || j.status === "Collected"
          ).length,
          pending: allJobs.filter((j: any) => j.status === "Pending").length,
          unreadNotifications: notifRes.unreadCount || 0,
        });
      })
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  const activeJobs = jobs.filter(
    (j) => !["Collected", "Refused"].includes(j.status)
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[88px] rounded-xl" />
          ))}
        </div>
        <TableSkeleton rows={5} cols={4} />
      </div>
    );
  }

  const statTiles = [
    { label: "Total jobs", value: stats.total, icon: Watch },
    { label: "In progress", value: stats.active, icon: Wrench },
    { label: "Completed", value: stats.completed, icon: CheckCircle2 },
    { label: "Unread notifications", value: stats.unreadNotifications, icon: Bell },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My dashboard"
        description="Welcome to the Zojotu service portal"
        actions={
          <Link href="/portal/jobs/new" className={buttonClasses()}>
            <PlusCircle />
            Request service
          </Link>
        }
      />

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statTiles.map((tile) => (
          <Card key={tile.label}>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-secondary p-2.5">
                <tile.icon aria-hidden className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums text-foreground">{tile.value}</p>
                <p className="text-xs text-muted-foreground">{tile.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pending notice */}
      {stats.pending > 0 && (
        <div className="flex items-center gap-3 rounded-lg bg-warning-wash px-4 py-3">
          <Clock aria-hidden className="h-5 w-5 text-warning-ink" />
          <p className="text-sm text-warning-ink">
            You have <strong>{stats.pending}</strong> request{stats.pending !== 1 ? "s" : ""} awaiting review.
          </p>
        </div>
      )}

      {/* Recent jobs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Recent jobs</h2>
          {stats.total > 0 && (
            <Link href="/portal/jobs" className="text-sm text-link hover:underline">
              View all jobs
            </Link>
          )}
        </div>

        {activeJobs.length === 0 && stats.total === 0 ? (
          <EmptyState
            icon={Package}
            title="No service requests yet"
            description="Tell us about your watch and what needs doing, and we'll review your request."
            action={
              <Link href="/portal/jobs/new" className={buttonClasses({ variant: "secondary", size: "sm" })}>
                Request your first service
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-xl bg-card shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="border-b border-border px-4 py-3 text-left text-xs font-medium text-muted-foreground">Watch</th>
                  <th className="border-b border-border px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="border-b border-border px-4 py-3 text-left text-xs font-medium text-muted-foreground">Submitted</th>
                  <th className="border-b border-border px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {jobs.slice(0, 5).map((job) => (
                  <tr key={job.id} className="border-t border-border transition-colors hover:bg-accent/50">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {job.watchBrand} {job.watchModel}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[job.status] ?? "neutral"}>{job.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(job.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/portal/jobs/${job.id}`}
                        className="text-sm text-link hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
