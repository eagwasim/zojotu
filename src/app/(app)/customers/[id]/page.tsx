"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Phone, MapPin, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

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
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!customer) return <p className="text-muted-foreground">Customer not found</p>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/customers" className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{customer.displayName}</h1>
          <p className="text-sm text-muted-foreground">Customer since {formatDate(customer.createdAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Card>
            <h3 className="text-sm font-medium text-muted-foreground">Contact Info</h3>
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
                <p className="text-xs text-muted-foreground">Total Jobs</p>
                <p className="text-xl font-bold text-foreground">{customer.totalJobs}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-xl font-bold text-green-500">{customer.completedJobs}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="text-xl font-bold text-amber-500">{customer.activeJobs}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="text-xl font-bold text-foreground">{formatCurrency(customer.totalRevenue)}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <h3 className="text-sm font-medium text-muted-foreground">Service History</h3>
            {customer.jobs.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No service jobs yet</p>
            ) : (
              <div className="mt-3 overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Watch</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Cost</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.jobs.map((job) => (
                      <tr key={job.id} className="border-t border-border">
                        <td className="px-3 py-2 font-medium text-foreground">
                          {job.watchBrand} {job.watchModel}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[job.status] || ""}`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono text-foreground">
                          {job.finalCost ? formatCurrency(job.finalCost) : "—"}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {formatDate(job.createdAt)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Link href={`/services/${job.id}`} className="text-muted-foreground hover:text-foreground">
                            <Eye className="inline h-4 w-4" />
                          </Link>
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
    </motion.div>
  );
}
