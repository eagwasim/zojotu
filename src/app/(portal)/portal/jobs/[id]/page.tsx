"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
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
  paymentInformation?: string;
  isPaid: number;
  createdAt: string;
}

const STATUS_STEPS = [
  { key: "Pending", label: "Pending", icon: Clock },
  { key: "Accepted", label: "Accepted", icon: CheckCircle2 },
  { key: "Shipped", label: "Shipped", icon: Truck },
  { key: "Received", label: "Received", icon: Package },
  { key: "In Progress", label: "In progress", icon: Wrench },
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
      <div role="status" aria-label="Loading" className="space-y-6">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-28 rounded-xl" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!job) return <p className="text-muted-foreground">Job not found</p>;

  const isRefused = job.status === "Refused";
  const currentStepIdx = STATUS_STEPS.findIndex((s) => s.key === job.status);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <Link
            href="/portal/jobs"
            className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft aria-hidden className="h-4 w-4" />
            My service jobs
          </Link>
        }
        title={`${job.watchBrand} ${job.watchModel}`}
        description={`Job #${job.id} — Submitted ${formatDate(job.createdAt)}`}
      />

      {isRefused ? (
        <Card>
          <div className="flex items-start gap-3">
            <XCircle aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-critical-ink" />
            <div>
              <p className="font-medium text-critical-ink">Request declined</p>
              <p className="mt-1 text-sm text-foreground">
                {job.rejectionReason}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <h3 className="text-sm font-semibold text-foreground">
            Service progress
          </h3>
          <div className="mt-4 flex items-center gap-1">
            {STATUS_STEPS.map((step, idx) => {
              const isActive = idx <= currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              return (
                <div key={step.key} className="flex flex-1 flex-col items-center">
                  <div
                    aria-current={isCurrent ? "step" : undefined}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                      isCurrent
                        ? "border-primary bg-primary text-primary-foreground"
                        : isActive
                          ? "border-good bg-good-wash text-good-ink"
                          : "border-border bg-muted text-muted-foreground"
                    }`}
                  >
                    <step.icon className="h-4 w-4" />
                  </div>
                  <span
                    className={`mt-1.5 text-[10px] font-medium ${
                      isCurrent
                        ? "text-foreground"
                        : isActive
                          ? "text-good-ink"
                          : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                  {idx < STATUS_STEPS.length - 1 && (
                    <div
                      className={`absolute mt-4 h-0.5 w-full ${isActive ? "bg-good" : "bg-border"}`}
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
          <h3 className="text-sm font-semibold text-foreground">
            Issue description
          </h3>
          <p className="mt-2 text-foreground">{job.issueDescription}</p>
          {job.watchSerial && (
            <p className="mt-2 text-xs text-muted-foreground">
              Serial: {job.watchSerial}
            </p>
          )}
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-foreground">Cost</h3>
          <div className="mt-3 space-y-2">
            {job.estimatedCost && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Estimated</span>
                <span className="tabular-nums text-foreground">
                  {formatCurrency(job.estimatedCost)}
                </span>
              </div>
            )}
            {job.finalCost && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Final</span>
                <span className="font-semibold tabular-nums text-foreground">
                  {formatCurrency(job.finalCost)}
                </span>
              </div>
            )}
            {!job.estimatedCost && !job.finalCost && (
              <p className="text-sm text-muted-foreground">
                Cost will be provided after diagnosis
              </p>
            )}
            <div className="flex items-center justify-between border-t border-border pt-2">
              <span className="text-sm text-muted-foreground">Payment</span>
              <Badge tone={job.isPaid ? "good" : "warning"}>
                {job.isPaid ? "Paid" : "Pending"}
              </Badge>
            </div>

            {job.paymentInformation && !job.isPaid && (
              <div className="mt-3 rounded-md bg-secondary p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Payment details</p>
                {job.paymentInformation.startsWith("http") ? (
                  <a
                    href={job.paymentInformation}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClasses({ className: "w-full" })}
                  >
                    Pay now
                  </a>
                ) : (
                  <div className="rounded bg-card p-2">
                    <p className="font-mono text-xs text-foreground break-all select-all">
                      {job.paymentInformation}
                    </p>
                  </div>
                )}
                <p className="mt-2 text-[10px] text-muted-foreground text-center">
                  Please include Job #{job.id} as a reference
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {job.shippingAddress && !["Pending", "Refused"].includes(job.status) && (
        <Card>
          <div className="flex items-start gap-3">
            <Truck aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
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
          <h3 className="text-sm font-semibold text-foreground">
            Tracking information
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
          <h3 className="text-sm font-semibold text-foreground">
            Technician notes
          </h3>
          <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
            {job.technicianNotes}
          </p>
        </Card>
      )}

      {job.warrantyPeriod && (
        <Card>
          <h3 className="text-sm font-semibold text-foreground">
            Warranty
          </h3>
          <p className="mt-2 text-foreground">{job.warrantyPeriod}</p>
        </Card>
      )}

      <Card>
        <h3 className="text-sm font-semibold text-foreground">Timeline</h3>
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
    </div>
  );
}
