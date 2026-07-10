"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Watch,
  Wrench,
  Package,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

const STATUS_COLORS: Record<string, string> = {
  Pending: "text-yellow-500",
  Accepted: "text-blue-500",
  Refused: "text-red-500",
  Shipped: "text-indigo-500",
  Received: "text-purple-500",
  Diagnosed: "text-cyan-500",
  "In Progress": "text-amber-500",
  Completed: "text-green-500",
  Collected: "text-zinc-500",
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
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
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome to Van Christaan service portal
          </p>
        </div>
        <Link href="/portal/jobs/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Request Service
          </Button>
        </Link>
      </div>

      {/* Stats cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        <motion.div variants={item}>
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <Watch className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Jobs</p>
              </div>
            </div>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-500/10 p-2.5">
                <Wrench className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.active}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/10 p-2.5">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2.5">
                <Bell className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.unreadNotifications}</p>
                <p className="text-xs text-muted-foreground">Unread</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Pending notice */}
      {stats.pending > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
          <Clock className="h-5 w-5 text-yellow-500" />
          <p className="text-sm text-foreground">
            You have <strong>{stats.pending}</strong> request{stats.pending !== 1 ? "s" : ""} awaiting review.
          </p>
        </div>
      )}

      {/* Recent jobs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Recent Jobs</h2>
          {stats.total > 0 && (
            <Link href="/portal/jobs" className="text-sm text-primary hover:underline">
              View all
            </Link>
          )}
        </div>

        {activeJobs.length === 0 && stats.total === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                No service requests yet
              </p>
              <Link href="/portal/jobs/new" className="mt-3">
                <Button variant="secondary" size="sm">
                  Request your first service
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Watch</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Submitted</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {jobs.slice(0, 5).map((job) => (
                  <tr key={job.id} className="border-t border-border transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {job.watchBrand} {job.watchModel}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {job.status === "Completed" || job.status === "Collected" ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        ) : job.status === "Refused" ? (
                          <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                        ) : (
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <span className={`text-sm font-medium ${STATUS_COLORS[job.status] || "text-muted-foreground"}`}>
                          {job.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(job.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/portal/jobs/${job.id}`}
                        className="text-sm text-primary hover:underline"
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
    </motion.div>
  );
}
