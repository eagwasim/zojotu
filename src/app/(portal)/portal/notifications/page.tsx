"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { formatDate } from "@/lib/utils";
import { apiPut } from "@/lib/api-client";
import Link from "next/link";

interface Notification {
  id: number;
  serviceJobId: number | null;
  type: string;
  title: string;
  message: string;
  read: number;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = (p: number) => {
    setLoading(true);
    fetch(`/api/notifications?page=${p}&pageSize=20`)
      .then((r) => r.json())
      .then((res) => {
        setNotifications(res.data || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications(page);
  }, [page]);

  const handleMarkAllRead = async () => {
    await apiPut("/api/notifications/read-all", {});
    fetchNotifications(page);
  };

  const handleMarkRead = async (id: number) => {
    await apiPut(`/api/notifications/${id}/read`, {});
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: 1 } : n))
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={`${total} notification${total !== 1 ? "s" : ""}`}
        actions={
          <Button variant="secondary" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck />
            Mark all as read
          </Button>
        }
      />

      {loading ? (
        <div role="status" aria-label="Loading" className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[68px] rounded-lg" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="Updates about your service requests will appear here."
        />
      ) : (
        <>
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.read && handleMarkRead(n.id)}
                className={`cursor-pointer rounded-lg px-4 py-3 transition-colors ${
                  n.read
                    ? "border border-border bg-background hover:bg-accent/50"
                    : "bg-card shadow-card hover:bg-accent/50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={`text-sm text-foreground ${n.read ? "font-medium" : "font-semibold"}`}>{n.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                  </div>
                  <div className="ml-4 flex flex-col items-end gap-1">
                    <span className="text-xs text-muted-foreground">{formatDate(n.createdAt)}</span>
                    {!n.read && (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-link">
                        <span aria-hidden className="h-2 w-2 rounded-full bg-link" />
                        Unread
                      </span>
                    )}
                  </div>
                </div>
                {n.serviceJobId && (
                  <Link
                    href={`/portal/jobs/${n.serviceJobId}`}
                    className="mt-1 inline-block text-xs text-link hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View job
                  </Link>
                )}
              </div>
            ))}
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
