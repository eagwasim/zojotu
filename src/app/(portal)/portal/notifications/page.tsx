"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} notification{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
          <CheckCheck className="mr-2 h-4 w-4" />
          Mark all read
        </Button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <Bell className="h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No notifications yet</p>
          </div>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.read && handleMarkRead(n.id)}
                className={`cursor-pointer rounded-lg border px-4 py-3 transition-colors ${
                  n.read
                    ? "border-border bg-background"
                    : "border-primary/20 bg-primary/5"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                  </div>
                  <div className="ml-4 flex flex-col items-end gap-1">
                    <span className="text-xs text-muted-foreground">{formatDate(n.createdAt)}</span>
                    {!n.read && (
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                </div>
                {n.serviceJobId && (
                  <Link
                    href={`/portal/jobs/${n.serviceJobId}`}
                    className="mt-1 inline-block text-xs text-primary hover:underline"
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
    </motion.div>
  );
}
