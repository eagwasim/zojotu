"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, HandCoins, Pencil, Tag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { StageStepper } from "@/components/watches/stage-stepper";
import { WatchPhotos, type WatchImage } from "@/components/watches/watch-photos";
import { WatchParts, type WatchPart } from "@/components/watches/watch-parts";
import { ListWatchDialog } from "@/components/watches/list-watch-dialog";
import { WatchFormSheet, type WatchRecord } from "@/components/watches/watch-form-sheet";
import { RecordSaleSheet, type SaleRecord } from "@/components/sales/record-sale-sheet";
import { apiDelete, apiPut } from "@/lib/api-client";
import { estimateFee, feeRateFor } from "@/lib/platform-fees";
import { usePlatformFees } from "@/hooks/use-form-data";
import { cn, formatCurrency, formatPercentage, formatDate } from "@/lib/utils";

interface WatchDetail extends WatchRecord {
  primaryImageId?: number | null;
  parts: WatchPart[];
  images: WatchImage[];
  sale: SaleRecord | null;
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

function daysSince(date: string) {
  return Math.max(0, Math.round((Date.now() - new Date(date).getTime()) / 86_400_000));
}

export default function WatchDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const fees = usePlatformFees();

  const [watch, setWatch] = useState<WatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [saleOpen, setSaleOpen] = useState(false);
  const [moving, setMoving] = useState(false);

  const load = useCallback(() => {
    return fetch(`/api/watches/${params.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setWatch)
      .finally(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    try {
      await apiDelete(`/api/watches/${params.id}`);
      toast("Watch deleted", "success");
      router.push("/inventory");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't delete the watch", "error");
      setDeleteOpen(false);
    }
  };

  const moveTo = async (status: string) => {
    if (!watch) return;
    if (status === "Listed") return setListOpen(true);
    if (status === "Sold") return setSaleOpen(true);
    setMoving(true);
    const previous = watch;
    setWatch({ ...watch, status }); // optimistic
    try {
      await apiPut(`/api/watches/${watch.id}`, { status });
      load();
    } catch (e) {
      setWatch(previous);
      toast(e instanceof Error ? e.message : "Couldn't change the stage", "error");
    } finally {
      setMoving(false);
    }
  };

  if (loading) {
    return (
      <div role="status" aria-label="Loading" className="space-y-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!watch) {
    return (
      <EmptyState
        title="Watch not found"
        description="It may have been deleted."
        action={
          <Link href="/inventory" className="text-sm font-medium text-link hover:underline">
            Back to inventory
          </Link>
        }
      />
    );
  }

  const { economics: e } = watch;
  const sold = watch.status === "Sold";
  const listed = watch.status === "Listed";
  const rate = feeRateFor(fees, watch.listedPlatform);
  const expectedFee = listed && watch.askingPrice && rate !== null ? estimateFee(watch.askingPrice, rate) : 0;
  const expectedProfit = listed && watch.askingPrice ? watch.askingPrice - expectedFee - e.totalCogs : null;
  const daysListed = listed && watch.listedDate ? daysSince(watch.listedDate) : null;

  // The one thing to do next, by stage.
  const primaryAction = sold ? null : listed ? (
    <Button onClick={() => setSaleOpen(true)}>
      <HandCoins />
      Record sale
    </Button>
  ) : (
    <Button onClick={() => setListOpen(true)}>
      <Tag />
      Mark as listed
    </Button>
  );

  const details: [string, React.ReactNode][] = [
    ["Movement", watch.movementType],
    ["Condition", watch.condition],
    ["Reference", watch.reference],
    ["Serial", watch.serial],
    ["Bought from", watch.source],
    ["Acquired", formatDate(watch.acquisitionDate)],
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4">
        <Link
          href="/inventory"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Inventory
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{watch.brand}</p>
            <h1 className="font-display text-3xl font-medium tracking-tight text-foreground">{watch.model}</h1>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              <Pencil />
              Edit
            </Button>
            {primaryAction}
            <IconButton aria-label="Delete watch" tone="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 />
            </IconButton>
          </div>
        </div>
        <div className="rounded-xl bg-card p-2 shadow-card">
          <StageStepper
            status={watch.status}
            acquisitionDate={watch.acquisitionDate}
            listedDate={watch.listedDate}
            soldDate={watch.sale?.saleDate}
            onSelect={moveTo}
            disabled={moving}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <WatchPhotos
            watchId={watch.id}
            images={watch.images}
            primaryImageId={watch.primaryImageId}
            uploadStage={listed || sold ? "after" : "before"}
            onChange={load}
          />
          <WatchParts watchId={watch.id} parts={watch.parts} onChange={load} />
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{sold ? "Result" : listed ? "Listing" : "Cost so far"}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col gap-2 text-sm tabular-nums">
                <Line label="Paid" value={formatCurrency(e.baseCost)} />
                <Line label="Parts & mods" value={formatCurrency(e.totalPartsCost)} />
                <Line label="Cost basis" value={formatCurrency(e.totalCogs)} strong divider />

                {listed && (
                  <>
                    <Line
                      label="Asking price"
                      value={watch.askingPrice ? formatCurrency(watch.askingPrice) : "Not set"}
                      divider
                    />
                    <Line
                      label={`Est. fee${watch.listedPlatform ? ` (${watch.listedPlatform})` : ""}`}
                      value={rate === null ? "No rate saved" : formatCurrency(expectedFee)}
                      muted={rate === null}
                    />
                    <Line
                      label="Expected profit"
                      value={expectedProfit === null ? "—" : formatCurrency(expectedProfit)}
                      strong
                      negative={expectedProfit !== null && expectedProfit < 0}
                    />
                    {expectedProfit !== null && watch.askingPrice ? (
                      <Line label="Expected margin" value={formatPercentage(expectedProfit / watch.askingPrice)} />
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setListOpen(true)}
                      className="mt-1 w-fit text-xs font-medium text-link hover:underline"
                    >
                      Edit listing
                    </button>
                  </>
                )}

                {sold && watch.sale && (
                  <>
                    <Line label="Sale price" value={formatCurrency(watch.sale.grossSalePrice)} divider />
                    <Line label="Fees" value={formatCurrency(-watch.sale.platformFee || 0)} />
                    <Line label="Shipping & insurance" value={formatCurrency(-watch.sale.shippingInsurance || 0)} />
                    <Line
                      label="Profit"
                      value={formatCurrency(e.unitNetProfit)}
                      strong
                      negative={e.unitNetProfit < 0}
                    />
                    <Line label="Return on cost" value={formatPercentage(e.unitRoi)} />
                  </>
                )}

                <Line
                  label={sold ? "Days to sell" : daysListed !== null ? "Days listed" : "Days in stock"}
                  value={String(daysListed ?? e.daysInInventory)}
                  divider
                  warn={!sold && (daysListed ?? e.daysInInventory) > 60}
                />
              </dl>
            </CardContent>
          </Card>

          {sold && watch.sale && (
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Sale</CardTitle>
                <button
                  type="button"
                  onClick={() => setSaleOpen(true)}
                  className="text-xs font-medium text-link hover:underline"
                >
                  Edit sale
                </button>
              </CardHeader>
              <CardContent>
                <dl className="flex flex-col gap-2 text-sm">
                  <Line label="Sold on" value={formatDate(watch.sale.saleDate)} />
                  <Line label="Platform" value={watch.sale.platform} />
                  {watch.sale.notes && <p className="pt-1 text-muted-foreground">{watch.sale.notes}</p>}
                </dl>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Details</CardTitle>
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="text-xs font-medium text-link hover:underline"
              >
                Edit details
              </button>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col gap-2 text-sm">
                {details
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <Line key={k} label={k} value={v} />
                  ))}
              </dl>
              {watch.notes && (
                <p className="mt-4 whitespace-pre-line border-t border-border pt-4 text-sm text-foreground">
                  {watch.notes}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <WatchFormSheet open={editOpen} onClose={() => setEditOpen(false)} watch={watch} onSaved={load} />
      <ListWatchDialog
        open={listOpen}
        onClose={() => setListOpen(false)}
        watch={watch}
        costBasis={e.totalCogs}
        onSaved={load}
      />
      <RecordSaleSheet
        open={saleOpen}
        onClose={() => setSaleOpen(false)}
        sale={watch.sale}
        watch={{
          id: watch.id,
          label: `${watch.brand} ${watch.model}`,
          costBasis: e.totalCogs,
          askingPrice: watch.askingPrice,
          listedPlatform: watch.listedPlatform,
        }}
        onSaved={load}
      />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete watch"
        message={`Delete "${watch.brand} ${watch.model}"? Its parts, sale and photos will be permanently removed.`}
      />
    </div>
  );
}

function Line({
  label,
  value,
  strong,
  divider,
  muted,
  negative,
  warn,
}: {
  label: string;
  value: React.ReactNode;
  strong?: boolean;
  divider?: boolean;
  muted?: boolean;
  negative?: boolean;
  warn?: boolean;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4", divider && "mt-1 border-t border-border pt-3")}>
      <dt className={cn("text-muted-foreground", strong && "font-medium text-foreground")}>{label}</dt>
      <dd
        className={cn(
          "text-right text-foreground",
          strong && "font-semibold",
          muted && "text-muted-foreground",
          negative && "text-critical-ink",
          warn && "font-medium text-warning-ink"
        )}
      >
        {value}
        {warn && <span className="sr-only"> (a long time)</span>}
      </dd>
    </div>
  );
}
