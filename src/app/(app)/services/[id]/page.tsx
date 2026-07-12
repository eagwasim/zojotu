"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Package,
  Truck,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!job) return <p className="text-muted-foreground">Job not found</p>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/services" className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">
            {job.watchBrand} {job.watchModel}
          </h1>
          <p className="text-sm text-muted-foreground">Job #{job.id} — {job.status}</p>
        </div>
        {job.status === "Pending" && (
          <div className="flex gap-2">
            <Button onClick={handleAccept}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Accept
            </Button>
            <Button variant="destructive" onClick={() => setRefuseOpen(true)}>
              <XCircle className="mr-2 h-4 w-4" />
              Refuse
            </Button>
          </div>
        )}
        {job.status !== "Pending" && (
          <Button onClick={() => setStatusOpen(true)}>
            Update Status
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h3 className="text-sm font-medium text-muted-foreground">Issue Description</h3>
            <p className="mt-2 text-foreground">{job.issueDescription}</p>
            {job.watchSerial && (
              <p className="mt-2 text-xs text-muted-foreground">Serial: {job.watchSerial}</p>
            )}
            {job.rejectionReason && (
              <div className="mt-3 rounded-md bg-red-500/10 p-3">
                <p className="text-sm font-medium text-red-500">Rejection Reason</p>
                <p className="mt-1 text-sm text-foreground">{job.rejectionReason}</p>
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">Costs</h3>
              <Button variant="ghost" size="sm" onClick={() => setCostOpen(true)}>Edit</Button>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Estimated</p>
                <p className="text-lg font-semibold text-foreground">
                  {job.estimatedCost ? formatCurrency(job.estimatedCost) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Final</p>
                <p className="text-lg font-semibold text-foreground">
                  {job.finalCost ? formatCurrency(job.finalCost) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Payment</p>
                <button onClick={handleTogglePaid} className={`mt-1 rounded-full px-3 py-0.5 text-xs font-medium ${job.isPaid ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"}`}>
                  {job.isPaid ? "Paid" : "Unpaid"}
                </button>
              </div>
            </div>
            {job.paymentInformation && (
              <div className="mt-4 space-y-2 border-t border-border pt-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Payment Details</span>
                  {job.paymentInformation.startsWith('http') ? (
                    <a href={job.paymentInformation} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[200px]">
                      {job.paymentInformation}
                    </a>
                  ) : (
                    <span className="font-mono text-foreground">{job.paymentInformation}</span>
                  )}
                </div>
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">Parts Used</h3>
              <Button variant="ghost" size="sm" onClick={() => setPartOpen(true)}>
                <Plus className="mr-1 h-3 w-3" /> Add
              </Button>
            </div>
            {parts.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No parts added yet</p>
            ) : (
              <div className="mt-3 space-y-2">
                {parts.map((part) => (
                  <div key={part.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{part.description}</p>
                      <p className="text-xs text-muted-foreground">{part.category} — qty: {part.quantity}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-foreground">{formatCurrency(part.cost * part.quantity)}</span>
                      <button onClick={() => handleDeletePart(part.id)} className="rounded p-1 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">Technician Notes</h3>
              <Button variant="ghost" size="sm" onClick={() => setNotesOpen(true)}>Edit</Button>
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
              <h3 className="text-sm font-medium text-muted-foreground">Shipping & Tracking</h3>
              <Button variant="ghost" size="sm" onClick={() => setTrackingOpen(true)}>
                <Truck className="mr-1 h-3 w-3" /> Edit
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
                  <p className="font-mono text-foreground">{job.trackingCarrier}: {job.trackingNumber}</p>
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
      <Dialog open={statusOpen} onClose={() => setStatusOpen(false)} title="Update Status">
        <form onSubmit={handleStatusUpdate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">New Status</label>
            <select
              name="status"
              defaultValue={job.status}
              className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {STATUS_FLOW.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setStatusOpen(false)}>Cancel</Button>
            <Button type="submit">Update</Button>
          </div>
        </form>
      </Dialog>

      {/* Refuse Dialog */}
      <Dialog open={refuseOpen} onClose={() => setRefuseOpen(false)} title="Refuse Service Request">
        <form onSubmit={handleRefuse} className="space-y-4">
          <Input label="Reason" name="reason" placeholder="Why is this request being refused?" required />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setRefuseOpen(false)}>Cancel</Button>
            <Button type="submit" variant="destructive">Refuse</Button>
          </div>
        </form>
      </Dialog>

      {/* Tracking Dialog */}
      <Dialog open={trackingOpen} onClose={() => setTrackingOpen(false)} title="Update Tracking">
        <form onSubmit={handleTracking} className="space-y-4">
          <Input label="Tracking Number" name="trackingNumber" defaultValue={job.trackingNumber || ""} placeholder="e.g. 1Z999AA10123456784" />
          <Input label="Carrier" name="trackingCarrier" defaultValue={job.trackingCarrier || ""} placeholder="e.g. UPS, DHL, PostNL" />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setTrackingOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Dialog>

      {/* Add Part Dialog */}
      <Dialog open={partOpen} onClose={() => setPartOpen(false)} title="Add Part">
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
            <Button type="submit">Add Part</Button>
          </div>
        </form>
      </Dialog>

      {/* Cost Dialog */}
      <Dialog open={costOpen} onClose={() => setCostOpen(false)} title="Update Costs">
        <form onSubmit={handleUpdateCosts} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Estimated Cost" name="estimatedCost" type="number" step="0.01" defaultValue={job.estimatedCost?.toString() || ""} />
            <Input label="Final Cost" name="finalCost" type="number" step="0.01" defaultValue={job.finalCost?.toString() || ""} />
          </div>
          <Input label="Payment Information" name="paymentInformation" defaultValue={job.paymentInformation || ""} placeholder="IBAN or Payment Link (Stripe/PayPal)" />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setCostOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={notesOpen} onClose={() => setNotesOpen(false)} title="Technician Notes">
        <form onSubmit={handleUpdateNotes} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Notes</label>
            <textarea
              name="technicianNotes"
              defaultValue={job.technicianNotes || ""}
              rows={5}
              className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Detailed notes about the service..."
            />
          </div>
          <Input label="Warranty Period" name="warrantyPeriod" defaultValue={job.warrantyPeriod || ""} placeholder="e.g. 6 months" />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setNotesOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Dialog>
    </motion.div>
  );
}
