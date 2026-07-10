"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatCurrency, formatPercentage, formatDate } from "@/lib/utils";

interface WatchDetail {
  id: number;
  brand: string;
  model: string;
  reference?: string;
  movementType: string;
  acquisitionDate: string;
  source: string;
  baseCost: number;
  status: string;
  notes?: string;
  parts: {
    id: number;
    description: string;
    category: string;
    cost: number;
    date: string;
    supplier?: string;
  }[];
  sale: {
    id: number;
    saleDate: string;
    platform: string;
    grossSalePrice: number;
    platformFee: number;
    shippingInsurance: number;
  } | null;
  economics: {
    baseCost: number;
    totalPartsCost: number;
    totalCogs: number;
    grossRevenue: number;
    netRevenue: number;
    unitNetProfit: number;
    unitRoi: number;
    daysInInventory: number;
  };
}

export default function WatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [watch, setWatch] = useState<WatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/watches/${params.id}`)
      .then((r) => r.json())
      .then(setWatch)
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleDelete = async () => {
    await fetch(`/api/watches/${params.id}`, { method: "DELETE" });
    router.push("/inventory");
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!watch) {
    return (
      <div className="text-center text-muted-foreground">Watch not found</div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/inventory")}
          className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">
            {watch.brand} {watch.model}
          </h1>
          <div className="mt-1 flex items-center gap-3">
            <StatusBadge status={watch.status} />
            <span className="text-sm text-muted-foreground">
              Acquired {formatDate(watch.acquisitionDate)} from {watch.source}
            </span>
          </div>
        </div>
        <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Unit Economics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Base Cost</span>
              <span className="font-mono text-sm">
                {formatCurrency(watch.economics.baseCost)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Parts Cost</span>
              <span className="font-mono text-sm">
                {formatCurrency(watch.economics.totalPartsCost)}
              </span>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <span className="text-sm font-medium text-foreground">
                Total COGS
              </span>
              <span className="font-mono text-sm font-medium">
                {formatCurrency(watch.economics.totalCogs)}
              </span>
            </div>
            {watch.sale && (
              <>
                <div className="flex justify-between border-t border-border pt-2">
                  <span className="text-sm text-muted-foreground">
                    Net Revenue
                  </span>
                  <span className="font-mono text-sm">
                    {formatCurrency(watch.economics.netRevenue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-primary">
                    Net Profit
                  </span>
                  <span className="font-mono text-sm font-medium text-primary">
                    {formatCurrency(watch.economics.unitNetProfit)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">ROI</span>
                  <span className="font-mono text-sm">
                    {formatPercentage(watch.economics.unitRoi)}
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between border-t border-border pt-2">
              <span className="text-sm text-muted-foreground">
                Days in Inventory
              </span>
              <span className="text-sm">{watch.economics.daysInInventory}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Parts & Modifications ({watch.parts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {watch.parts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No parts added yet
              </p>
            ) : (
              <div className="space-y-2">
                {watch.parts.map((part) => (
                  <div
                    key={part.id}
                    className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {part.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {part.category}
                        {part.supplier && ` • ${part.supplier}`} •{" "}
                        {formatDate(part.date)}
                      </p>
                    </div>
                    <span className="font-mono text-sm text-foreground">
                      {formatCurrency(part.cost)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {watch.sale && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Sale Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Platform</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {watch.sale.platform}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gross Price</p>
                <p className="mt-1 font-mono text-sm font-medium text-foreground">
                  {formatCurrency(watch.sale.grossSalePrice)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fees & Shipping</p>
                <p className="mt-1 font-mono text-sm text-muted-foreground">
                  {formatCurrency(
                    watch.sale.platformFee + watch.sale.shippingInsurance
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sale Date</p>
                <p className="mt-1 text-sm text-foreground">
                  {formatDate(watch.sale.saleDate)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {watch.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground">{watch.notes}</p>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Watch"
        message={`Are you sure you want to delete "${watch.brand} ${watch.model}"? All associated parts, sales, and images will be permanently removed.`}
      />
    </motion.div>
  );
}
