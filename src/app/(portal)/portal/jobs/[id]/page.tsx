"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  Package,
  Wrench,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

interface ServiceJob {
  id: number;
  watchBrand: string;
  watchModel: string;
  watchSerial?: string;
  issueDescription: string;
  status: string;
  rejectionReason?: string;
  estimatedCost: number | null;
  finalCost: number | null;
  shippingAddress?: string;
  trackingNumber?: string;
  trackingCarrier?: string;
  dateReceived?: string;
  dateDiagnosed?: string;
  dateCompleted?: string;
  dateCollected?: string;
  technicianNotes?: string;
  warrantyPeriod?: string;
  isPaid: number;
  createdAt: string;
}

const STATUS_STEPS = [
  { key: "Pending", label: "Pending", icon: Clock },
  { key: "Accepted", label: "Accepted", icon: CheckCircle2 },
  { key: "Shipped", label: "Shipped", icon: Truck },
  { key: "Received", label: "Received", icon: Package },
  { key: "In Progress", label: "In Progress", icon: Wrench },
  { key: "Completed", label: "Completed", icon: CheckCircle2 },
  { key: "Collected", label: "Collected", icon: CheckCircle2 },
];

export default function PortalJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<ServiceJob | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/service-jobs/${id}`)
      .then((r) => r.json())
      .then(setJob)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!job) return <p className="text-muted-foreground">Job not found</p>;

  const isRefused = job.status === "Refused";
  const currentStepIdx = STATUS_STEPS.findIndex((s) => s.key === job.status);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <Link
          href="/portal/jobs"
          className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {job.watchBrand} {job.watchModel}
          </h1>
          <p className="text-sm text-muted-foreground">
            Job #{job.id} — Submitted {formatDate(job.createdAt)}
          </p>
        </div>
      </div>

      {isRefused ? (
        <Card>
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div>
              <p className="font-medium text-red-500">Request Declined</p>
              <p className="mt-1 text-sm text-foreground">
                {job.rejectionReason}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <h3 className="text-sm font-medium text-muted-foreground">
            Service Progress
          </h3>
          <div className="mt-4 flex items-center gap-1">
            {STATUS_STEPS.map((step, idx) => {
              const isActive = idx <= currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              return (
                <div key={step.key} className="flex flex-1 flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                      isCurrent
                        ? "border-primary bg-primary text-primary-foreground"
                        : isActive
                          ? "border-green-500 bg-green-500/10 text-green-500"
                          : "border-border bg-muted text-muted-foreground"
                    }`}
                  >
                    <step.icon className="h-4 w-4" />
                  </div>
                  <span
                    className={`mt-1.5 text-[10px] font-medium ${
                      isCurrent
                        ? "text-primary"
                        : isActive
                          ? "text-green-500"
                          : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                  {idx < STATUS_STEPS.length - 1 && (
                    <div
                      className={`absolute mt-4 h-0.5 w-full ${isActive ? "bg-green-500" : "bg-border"}`}
                      style={{ display: "none" }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="text-sm font-medium text-muted-foreground">
            Issue Description
          </h3>
          <p className="mt-2 text-foreground">{job.issueDescription}</p>
          {job.watchSerial && (
            <p className="mt-2 text-xs text-muted-foreground">
              Serial: {job.watchSerial}
            </p>
          )}
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-muted-foreground">Cost</h3>
          <div className="mt-3 space-y-2">
            {job.estimatedCost && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Estimated</span>
                <span className="font-mono text-foreground">
                  {formatCurrency(job.estimatedCost)}
                </span>
              </div>
            )}
            {job.finalCost && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Final</span>
                <span className="font-mono font-semibold text-foreground">
                  {formatCurrency(job.finalCost)}
                </span>
              </div>
            )}
            {!job.estimatedCost && !job.finalCost && (
              <p className="text-sm text-muted-foreground">
                Cost will be provided after diagnosis
              </p>
            )}
            <div className="flex justify-between border-t border-border pt-2">
              <span className="text-sm text-muted-foreground">Payment</span>
              <span
                className={`text-sm font-medium ${job.isPaid ? "text-green-500" : "text-yellow-500"}`}
              >
                {job.isPaid ? "Paid" : "Pending"}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {job.shippingAddress && !["Pending", "Refused"].includes(job.status) && (
        <Card>
          <div className="flex items-start gap-3">
            <Truck className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
            <div>
              <p className="font-medium text-foreground">
                Please ship your watch to:
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                {job.shippingAddress}
              </p>
            </div>
          </div>
        </Card>
      )}

      {job.trackingNumber && (
        <Card>
          <h3 className="text-sm font-medium text-muted-foreground">
            Tracking Information
          </h3>
          <div className="mt-2">
            <p className="text-foreground">
              <span className="text-muted-foreground">Carrier:</span>{" "}
              {job.trackingCarrier}
            </p>
            <p className="font-mono text-foreground">
              <span className="text-muted-foreground">Tracking #:</span>{" "}
              {job.trackingNumber}
            </p>
          </div>
        </Card>
      )}

      {job.technicianNotes && (
        <Card>
          <h3 className="text-sm font-medium text-muted-foreground">
            Technician Notes
          </h3>
          <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
            {job.technicianNotes}
          </p>
        </Card>
      )}

      {job.warrantyPeriod && (
        <Card>
          <h3 className="text-sm font-medium text-muted-foreground">
            Warranty
          </h3>
          <p className="mt-2 text-foreground">{job.warrantyPeriod}</p>
        </Card>
      )}

      <Card>
        <h3 className="text-sm font-medium text-muted-foreground">Timeline</h3>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Submitted</span>
            <span className="text-foreground">{formatDate(job.createdAt)}</span>
          </div>
          {job.dateReceived && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Received</span>
              <span className="text-foreground">{formatDate(job.dateReceived)}</span>
            </div>
          )}
          {job.dateDiagnosed && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Diagnosed</span>
              <span className="text-foreground">{formatDate(job.dateDiagnosed)}</span>
            </div>
          )}
          {job.dateCompleted && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Completed</span>
              <span className="text-foreground">{formatDate(job.dateCompleted)}</span>
            </div>
          )}
          {job.dateCollected && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Collected</span>
              <span className="text-foreground">{formatDate(job.dateCollected)}</span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
