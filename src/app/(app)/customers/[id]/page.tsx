"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Mail, Phone, MapPin, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { iconButtonClasses } from "@/components/ui/icon-button";

interface CustomerDetail {
  id: number;
  displayName: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: string;
  totalJobs: number;
  completedJobs: number;
  activeJobs: number;
  totalRevenue: number;
  lastServiceDate: string | null;
  jobs: {
    id: number;
    watchBrand: string;
    watchModel: string;
    status: string;
    finalCost: number | null;
    createdAt: string;
  }[];
}

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

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then((r) => r.json())
      .then(setCustomer)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div role="status" aria-label="Loading" className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!customer) return <p className="text-muted-foreground">Customer not found</p>;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <Link
            href="/customers"
            className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Customers
          </Link>
        }
        title={customer.displayName}
        description={`Customer since ${formatDate(customer.createdAt)}`}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Card>
            <h3 className="text-sm font-medium text-muted-foreground">Contact info</h3>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {customer.email}
              </div>
              {customer.phone && (
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {customer.phone}
                </div>
              )}
              {customer.address && (
                <div className="flex items-start gap-2 text-sm text-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="whitespace-pre-wrap">{customer.address}</span>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-muted-foreground">Statistics</h3>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Total jobs</p>
                <p className="text-xl font-semibold tabular-nums text-foreground">{customer.totalJobs}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-xl font-semibold tabular-nums text-foreground">{customer.completedJobs}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="text-xl font-semibold tabular-nums text-foreground">{customer.activeJobs}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="text-xl font-semibold tabular-nums text-foreground">{formatCurrency(customer.totalRevenue)}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <h3 className="text-sm font-medium text-muted-foreground">Service history</h3>
            {customer.jobs.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No service jobs yet</p>
            ) : (
              <div className="-mx-6 mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="border-b border-border px-4 py-3 text-left text-xs font-medium text-muted-foreground">Watch</th>
                      <th className="border-b border-border px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                      <th className="border-b border-border px-4 py-3 text-right text-xs font-medium text-muted-foreground">Cost</th>
                      <th className="border-b border-border px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                      <th className="border-b border-border px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.jobs.map((job) => (
                      <tr key={job.id} className="border-t border-border transition-colors hover:bg-accent/50">
                        <td className="px-4 py-3 font-medium text-foreground">
                          {job.watchBrand} {job.watchModel}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={STATUS_TONE[job.status] ?? "neutral"}>{job.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-foreground">
                          {job.finalCost ? formatCurrency(job.finalCost) : "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(job.createdAt)}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/services/${job.id}`}
                              aria-label={`View service job for ${job.watchBrand} ${job.watchModel}`}
                              title="View service job"
                              className={iconButtonClasses()}
                            >
                              <Eye className="size-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
