"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Truck,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/icon-button";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog } from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { apiPut, apiPost, apiDelete } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

interface ServiceJob {
  id: number;
  customerId: number;
  watchBrand: string;
  watchModel: string;
  watchSerial?: string;
  issueDescription: string;
  status: string;
  rejectionReason?: string;
  estimatedCost: number | null;
  finalCost: number | null;
  paymentInformation?: string;
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
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
}

interface ServicePart {
  id: number;
  description: string;
  category: string;
  cost: number;
  quantity: number;
  supplier?: string;
}

const STATUS_FLOW = [
  "Pending",
  "Accepted",
  "Shipped",
  "Received",
  "Diagnosed",
  "In Progress",
  "Completed",
  "Collected",
];

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

const PART_CATEGORIES = ["Hardware", "Movement", "Glass", "Dial", "Bezel", "Case", "Strap", "Battery", "Other"];

export default function ServiceJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [job, setJob] = useState<ServiceJob | null>(null);
  const [parts, setParts] = useState<ServicePart[]>([]);
  const [loading, setLoading] = useState(true);

  const [refuseOpen, setRefuseOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [partOpen, setPartOpen] = useState(false);
  const [costOpen, setCostOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  const fetchJob = () => {
    fetch(`/api/service-jobs/${id}`)
      .then((r) => r.json())
      .then(setJob)
      .finally(() => setLoading(false));
  };

  const fetchParts = () => {
    fetch(`/api/service-jobs/${id}/parts`)
      .then((r) => r.json())
      .then(setParts)
      .catch(() => {});
  };

  useEffect(() => {
    fetchJob();
    fetchParts();
  }, [id]);

  const handleAccept = async () => {
    try {
      await apiPut(`/api/service-jobs/${id}/accept`, {});
      toast("Request accepted", "success");
      fetchJob();
    } catch (e: any) {
      toast(e.message || "Failed", "error");
    }
  };

  const handleRefuse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const reason = new FormData(e.currentTarget).get("reason") as string;
    try {
      await apiPut(`/api/service-jobs/${id}/refuse`, { reason });
      toast("Request refused", "success");
      setRefuseOpen(false);
      fetchJob();
    } catch (e: any) {
      toast(e.message || "Failed", "error");
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const status = new FormData(e.currentTarget).get("status") as string;
    try {
      await apiPut(`/api/service-jobs/${id}/status`, { status });
      toast(`Status updated to ${status}`, "success");
      setStatusOpen(false);
      fetchJob();
    } catch (e: any) {
      toast(e.message || "Failed", "error");
    }
  };

  const handleTracking = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await apiPut(`/api/service-jobs/${id}/tracking`, {
        trackingNumber: fd.get("trackingNumber"),
        trackingCarrier: fd.get("trackingCarrier"),
      });
      toast("Tracking updated", "success");
      setTrackingOpen(false);
      fetchJob();
    } catch (e: any) {
      toast(e.message || "Failed", "error");
    }
  };

  const handleAddPart = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await apiPost(`/api/service-jobs/${id}/parts`, {
        description: fd.get("description"),
        category: fd.get("category"),
        cost: parseFloat(fd.get("cost") as string),
        quantity: parseInt(fd.get("quantity") as string) || 1,
        supplier: fd.get("supplier") || undefined,
      });
      toast("Part added", "success");
      setPartOpen(false);
      fetchParts();
    } catch (e: any) {
      toast(e.message || "Failed", "error");
    }
  };

  const handleDeletePart = async (partId: number) => {
    try {
      await apiDelete(`/api/service-jobs/${id}/parts/${partId}`);
      toast("Part removed", "success");
      fetchParts();
    } catch (e: any) {
      toast(e.message || "Failed", "error");
    }
  };

  const handleUpdateCosts = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await apiPut(`/api/service-jobs/${id}`, {
        estimatedCost: parseFloat(fd.get("estimatedCost") as string) || undefined,
        finalCost: parseFloat(fd.get("finalCost") as string) || undefined,
        paymentInformation: fd.get("paymentInformation"),
      });
      toast("Costs updated", "success");
      setCostOpen(false);
      fetchJob();
    } catch (e: any) {
      toast(e.message || "Failed", "error");
    }
  };

  const handleUpdateNotes = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await apiPut(`/api/service-jobs/${id}`, {
        technicianNotes: fd.get("technicianNotes"),
        warrantyPeriod: fd.get("warrantyPeriod") || undefined,
      });
      toast("Notes updated", "success");
      setNotesOpen(false);
      fetchJob();
    } catch (e: any) {
      toast(e.message || "Failed", "error");
    }
  };

  const handleTogglePaid = async () => {
    if (!job) return;
    try {
      await apiPut(`/api/service-jobs/${id}`, { isPaid: job.isPaid ? 0 : 1 });
      toast(job.isPaid ? "Marked unpaid" : "Marked paid", "success");
      fetchJob();
    } catch (e: any) {
      toast(e.message || "Failed", "error");
    }
  };

  if (loading) {
    return (
      <div role="status" aria-label="Loading" className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-xl lg:col-span-2" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!job) return <p className="text-muted-foreground">Job not found</p>;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <Link
            href="/services"
            className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Service jobs
          </Link>
        }
        title={`${job.watchBrand} ${job.watchModel}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span className="tabular-nums">Job #{job.id}</span>
            <Badge tone={STATUS_TONE[job.status] ?? "neutral"}>{job.status}</Badge>
          </span>
        }
        actions={
          job.status === "Pending" ? (
            <>
              <Button onClick={handleAccept}>
                <CheckCircle2 />
                Accept request
              </Button>
              <Button variant="destructive" onClick={() => setRefuseOpen(true)}>
                <XCircle />
                Refuse request
              </Button>
            </>
          ) : (
            <Button onClick={() => setStatusOpen(true)}>Update status</Button>
          )
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h3 className="text-sm font-medium text-muted-foreground">Issue description</h3>
            <p className="mt-2 text-foreground">{job.issueDescription}</p>
            {job.watchSerial && (
              <p className="mt-2 text-xs text-muted-foreground">Serial: {job.watchSerial}</p>
            )}
            {job.rejectionReason && (
              <div className="mt-3 rounded-md bg-critical-wash p-3">
                <p className="flex items-center gap-1.5 text-sm font-medium text-critical-ink">
                  <XCircle className="size-4" aria-hidden />
                  Rejection reason
                </p>
                <p className="mt-1 text-sm text-foreground">{job.rejectionReason}</p>
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">Costs</h3>
              <Button variant="ghost" size="sm" onClick={() => setCostOpen(true)}>Edit costs</Button>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Estimated</p>
                <p className="text-lg font-semibold tabular-nums text-foreground">
                  {job.estimatedCost ? formatCurrency(job.estimatedCost) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Final</p>
                <p className="text-lg font-semibold tabular-nums text-foreground">
                  {job.finalCost ? formatCurrency(job.finalCost) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Payment</p>
                <button
                  type="button"
                  onClick={handleTogglePaid}
                  title={job.isPaid ? "Mark as unpaid" : "Mark as paid"}
                  className="mt-1 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <Badge
                    tone={job.isPaid ? "good" : "warning"}
                    className="cursor-pointer transition-opacity hover:opacity-80"
                  >
                    {job.isPaid ? "Paid" : "Unpaid"}
                  </Badge>
                </button>
              </div>
            </div>
            {job.paymentInformation && (
              <div className="mt-4 space-y-2 border-t border-border pt-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Payment details</span>
                  {job.paymentInformation.startsWith('http') ? (
                    <a href={job.paymentInformation} target="_blank" rel="noopener noreferrer" className="max-w-[200px] truncate text-link hover:underline">
                      {job.paymentInformation}
                    </a>
                  ) : (
                    <span className="tabular-nums text-foreground">{job.paymentInformation}</span>
                  )}
                </div>
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">Parts used</h3>
              <Button variant="ghost" size="sm" onClick={() => setPartOpen(true)}>
                <Plus /> Add part
              </Button>
            </div>
            {parts.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No parts added yet</p>
            ) : (
              <div className="mt-3 space-y-2">
                {parts.map((part) => (
                  <div key={part.id} className="flex items-center justify-between rounded-md bg-secondary px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{part.description}</p>
                      <p className="text-xs text-muted-foreground">{part.category} — qty: {part.quantity}</p>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <span className="tabular-nums text-sm text-foreground">{formatCurrency(part.cost * part.quantity)}</span>
                      <IconButton
                        tone="destructive"
                        aria-label={`Remove ${part.description}`}
                        onClick={() => handleDeletePart(part.id)}
                      >
                        <Trash2 />
                      </IconButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">Technician notes</h3>
              <Button variant="ghost" size="sm" onClick={() => setNotesOpen(true)}>Edit notes</Button>
            </div>
            <p className="mt-2 text-sm text-foreground whitespace-pre-wrap">
              {job.technicianNotes || "No notes yet"}
            </p>
            {job.warrantyPeriod && (
              <p className="mt-2 text-xs text-muted-foreground">Warranty: {job.warrantyPeriod}</p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="text-sm font-medium text-muted-foreground">Customer</h3>
            <div className="mt-3 space-y-1">
              <p className="font-medium text-foreground">{job.customerName}</p>
              <p className="text-sm text-muted-foreground">{job.customerEmail}</p>
              {job.customerPhone && <p className="text-sm text-muted-foreground">{job.customerPhone}</p>}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">Shipping and tracking</h3>
              <Button variant="ghost" size="sm" onClick={() => setTrackingOpen(true)}>
                <Truck /> Edit tracking
              </Button>
            </div>
            <div className="mt-3 space-y-2 text-sm">
              {job.shippingAddress && (
                <div>
                  <p className="text-xs text-muted-foreground">Ship to:</p>
                  <p className="text-foreground whitespace-pre-wrap">{job.shippingAddress}</p>
                </div>
              )}
              {job.trackingNumber && (
                <div>
                  <p className="text-xs text-muted-foreground">Tracking:</p>
                  <p className="tabular-nums text-foreground">{job.trackingCarrier}: {job.trackingNumber}</p>
                </div>
              )}
              {!job.shippingAddress && !job.trackingNumber && (
                <p className="text-muted-foreground">No shipping info yet</p>
              )}
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-muted-foreground">Timeline</h3>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
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
      </div>

      {/* Update Status Dialog */}
      <Dialog open={statusOpen} onClose={() => setStatusOpen(false)} title="Update status">
        <form onSubmit={handleStatusUpdate} className="space-y-4">
          <Select
            label="New status"
            name="status"
            defaultValue={job.status}
            placeholder={false}
            options={STATUS_FLOW.map((s) => ({ value: s, label: s }))}
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setStatusOpen(false)}>Cancel</Button>
            <Button type="submit">Update status</Button>
          </div>
        </form>
      </Dialog>

      {/* Refuse Dialog */}
      <Dialog open={refuseOpen} onClose={() => setRefuseOpen(false)} title="Refuse service request">
        <form onSubmit={handleRefuse} className="space-y-4">
          <Input label="Reason" name="reason" placeholder="Why is this request being refused?" required />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setRefuseOpen(false)}>Cancel</Button>
            <Button type="submit" variant="destructive">Refuse request</Button>
          </div>
        </form>
      </Dialog>

      {/* Tracking Dialog */}
      <Dialog open={trackingOpen} onClose={() => setTrackingOpen(false)} title="Update tracking">
        <form onSubmit={handleTracking} className="space-y-4">
          <Input label="Tracking number" name="trackingNumber" defaultValue={job.trackingNumber || ""} placeholder="e.g. 1Z999AA10123456784" />
          <Input label="Carrier" name="trackingCarrier" defaultValue={job.trackingCarrier || ""} placeholder="e.g. UPS, DHL, PostNL" />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setTrackingOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Dialog>

      {/* Add Part Dialog */}
      <Dialog open={partOpen} onClose={() => setPartOpen(false)} title="Add part">
        <form onSubmit={handleAddPart} className="space-y-4">
          <Input label="Description" name="description" placeholder="e.g. Replacement crystal" required />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Category" name="category" options={PART_CATEGORIES.map((c) => ({ value: c, label: c }))} />
            <Input label="Cost" name="cost" type="number" step="0.01" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Quantity" name="quantity" type="number" defaultValue="1" />
            <Input label="Supplier" name="supplier" placeholder="Optional" />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setPartOpen(false)}>Cancel</Button>
            <Button type="submit">Add part</Button>
          </div>
        </form>
      </Dialog>

      {/* Cost Dialog */}
      <Dialog open={costOpen} onClose={() => setCostOpen(false)} title="Update costs">
        <form onSubmit={handleUpdateCosts} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Estimated cost" name="estimatedCost" type="number" step="0.01" defaultValue={job.estimatedCost?.toString() || ""} />
            <Input label="Final cost" name="finalCost" type="number" step="0.01" defaultValue={job.finalCost?.toString() || ""} />
          </div>
          <Input label="Payment information" name="paymentInformation" defaultValue={job.paymentInformation || ""} placeholder="IBAN or payment link (Stripe/PayPal)" />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setCostOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={notesOpen} onClose={() => setNotesOpen(false)} title="Technician notes">
        <form onSubmit={handleUpdateNotes} className="space-y-4">
          <Textarea
            label="Notes"
            name="technicianNotes"
            defaultValue={job.technicianNotes || ""}
            rows={5}
            placeholder="Detailed notes about the service…"
          />
          <Input label="Warranty period" name="warrantyPeriod" defaultValue={job.warrantyPeriod || ""} placeholder="e.g. 6 months" />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setNotesOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
