"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DateInput, isoDate } from "@/components/ui/date-input";
import { CreatableCombobox } from "@/components/ui/creatable-combobox";
import { Kbd } from "@/components/ui/kbd";
import { useToast } from "@/components/ui/toast";
import { apiPost, apiPut, ApiError } from "@/lib/api-client";
import { saleSchema } from "@/lib/validators/sale";
import { estimateFee, feeRateFor } from "@/lib/platform-fees";
import { saleProfit } from "@/lib/profit";
import { cn, formatCurrency, formatPercentage } from "@/lib/utils";
import {
  fieldErrors,
  withoutKey,
  invalidateSuggestions,
  serverFieldErrors,
  usePlatformFees,
  useSuggestions,
} from "@/hooks/use-form-data";

export interface SaleRecord {
  id: number;
  watchId: number;
  saleDate: string;
  platform: string;
  grossSalePrice: number;
  platformFee: number;
  shippingInsurance: number;
  notes?: string | null;
}

/** What the sheet knows about the watch being sold. */
export interface SaleWatchContext {
  id: number;
  label: string;
  /** Purchase + parts. Enables the live profit line. */
  costBasis?: number;
  askingPrice?: number | null;
  listedPlatform?: string | null;
}

interface RecordSaleSheetProps {
  open: boolean;
  onClose: () => void;
  /** Pre-selected watch (from its page). Omit to pick one. */
  watch?: SaleWatchContext | null;
  /** Edit an existing sale. */
  sale?: SaleRecord | null;
  onSaved?: (sale: SaleRecord) => void;
}

interface FormState {
  watchId: string;
  saleDate: string;
  platform: string;
  grossSalePrice: number | null;
  platformFee: number | null;
  /** True once the user types a fee, so we stop auto-filling it. */
  feeTouched: boolean;
  shippingInsurance: number | null;
  notes: string;
}

export function RecordSaleSheet({ open, onClose, watch, sale, onSaved }: RecordSaleSheetProps) {
  const { toast } = useToast();
  const platforms = useSuggestions("platform");
  const fees = usePlatformFees();
  const editing = !!sale;

  const [form, setForm] = useState<FormState>(() => initial());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [costBasis, setCostBasis] = useState<number | null>(null);
  const [formKey, setFormKey] = useState(0);

  function initial(): FormState {
    if (sale) {
      return {
        watchId: String(sale.watchId),
        saleDate: sale.saleDate,
        platform: sale.platform,
        grossSalePrice: sale.grossSalePrice,
        platformFee: sale.platformFee,
        feeTouched: true,
        shippingInsurance: sale.shippingInsurance,
        notes: sale.notes ?? "",
      };
    }
    return {
      watchId: watch ? String(watch.id) : "",
      saleDate: isoDate(),
      platform: watch?.listedPlatform ?? "",
      grossSalePrice: watch?.askingPrice ?? null,
      platformFee: null,
      feeTouched: false,
      shippingInsurance: null,
      notes: "",
    };
  }

  // Reset on open.
  const openKey = open ? `open:${sale?.id ?? "new"}:${watch?.id ?? ""}` : "closed";
  const [lastOpenKey, setLastOpenKey] = useState(openKey);
  if (openKey !== lastOpenKey) {
    setLastOpenKey(openKey);
    if (open) {
      setForm(initial());
      setErrors({});
      setCostBasis(watch?.costBasis ?? null);
      setFormKey((k) => k + 1);
    }
  }

  // Cost basis for a watch picked in the sheet (or when editing from the sales list).
  const selectedId = form.watchId;
  const needsCost = open && !!selectedId && (watch?.costBasis === undefined || String(watch?.id) !== selectedId);
  useEffect(() => {
    if (!needsCost) return;
    let alive = true;
    fetch(`/api/watches/${selectedId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((w) => alive && w?.economics && setCostBasis(w.economics.totalCogs))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [needsCost, selectedId]);

  const rate = feeRateFor(fees, form.platform);
  const autoFee = rate !== null && form.grossSalePrice !== null ? estimateFee(form.grossSalePrice, rate) : null;
  const fee = form.feeTouched ? form.platformFee : (autoFee ?? form.platformFee);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key as string]) setErrors((prev) => withoutKey(prev, key as string));
  };

  const payload = () => ({
    watchId: Number(form.watchId) || 0,
    saleDate: form.saleDate,
    platform: form.platform,
    grossSalePrice: form.grossSalePrice ?? NaN,
    platformFee: fee ?? 0,
    shippingInsurance: form.shippingInsurance ?? 0,
    notes: form.notes || undefined,
  });

  const save = async () => {
    const parsed = saleSchema.safeParse(payload());
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setSaving(true);
    try {
      const saved = editing
        ? await apiPut<SaleRecord>(`/api/sales/${sale!.id}`, parsed.data)
        : await apiPost<SaleRecord>("/api/sales", parsed.data);
      invalidateSuggestions();
      toast(editing ? "Sale updated" : "Sale recorded. The watch is now marked as sold.", "success");
      onSaved?.(saved);
      onClose();
    } catch (e) {
      const fe = e instanceof ApiError ? serverFieldErrors(e.body) : {};
      if (Object.keys(fe).length) setErrors(fe);
      toast(e instanceof Error ? e.message : "Couldn't save the sale", "error");
    } finally {
      setSaving(false);
    }
  };

  const price = form.grossSalePrice;
  const shipping = form.shippingInsurance ?? 0;
  const profit =
    price !== null && costBasis !== null
      ? saleProfit({ grossSalePrice: price, platformFee: fee ?? 0, shippingInsurance: shipping }, costBasis)
      : null;
  const margin = profit !== null && price ? profit / price : null;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? "Edit sale" : "Record sale"}
      description={watch?.label ?? (editing ? undefined : "Recording a sale marks the watch as sold.")}
      footer={
        <>
          <span className="mr-auto hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
            <Kbd>⌘</Kbd>
            <Kbd>↵</Kbd> to save
          </span>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="sale-form" disabled={saving}>
            {saving ? "Saving…" : editing ? "Save changes" : "Record sale"}
          </Button>
        </>
      }
    >
      <form
        id="sale-form"
        key={formKey}
        noValidate
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            save();
          }
        }}
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="flex flex-col gap-5"
      >
        {!watch && !editing && (
          <Combobox
            label="Watch"
            name="watchId"
            value={form.watchId}
            onChange={(v) => set("watchId", v)}
            fetchUrl="/api/watches/search"
            fetchParams={{ excludeStatus: "Sold" }}
            placeholder="Search your unsold watches…"
            error={errors.watchId}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <CurrencyInput
            label="Sale price"
            required
            value={form.grossSalePrice}
            onValueChange={(v) => set("grossSalePrice", v)}
            error={errors.grossSalePrice}
            hint={watch?.askingPrice ? `Asking price was ${formatCurrency(watch.askingPrice)}` : undefined}
          />
          <DateInput
            label="Sold on"
            value={form.saleDate}
            onValueChange={(v) => set("saleDate", v)}
            error={errors.saleDate}
          />
        </div>

        <CreatableCombobox
          label="Platform"
          required
          suggestions={platforms}
          value={form.platform}
          onValueChange={(v) => set("platform", v)}
          placeholder="eBay, Chrono24, private sale…"
          error={errors.platform}
        />

        <div className="grid grid-cols-2 gap-4">
          <CurrencyInput
            label="Platform fee"
            value={fee}
            onValueChange={(v) => {
              setForm((f) => ({ ...f, platformFee: v, feeTouched: true }));
            }}
            error={errors.platformFee}
            hint={
              rate === null
                ? form.platform
                  ? `No fee rate saved for ${form.platform}. Add one in Settings.`
                  : undefined
                : form.feeTouched && autoFee !== null && autoFee !== form.platformFee
                  ? `Estimate: ${formatCurrency(autoFee)} (${formatPercentage(rate)})`
                  : `${formatPercentage(rate)} of the sale price`
            }
          />
          <CurrencyInput
            label="Shipping & insurance"
            value={form.shippingInsurance}
            onValueChange={(v) => set("shippingInsurance", v)}
            error={errors.shippingInsurance}
          />
        </div>
        {form.feeTouched && autoFee !== null && autoFee !== form.platformFee && (
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, feeTouched: false, platformFee: null }))}
            className="-mt-3 w-fit text-xs font-medium text-link hover:underline"
          >
            Use the {formatPercentage(rate!)} estimate
          </button>
        )}

        <div aria-live="polite" className="rounded-lg bg-secondary/60 p-4 text-sm">
          <dl className="flex flex-col gap-1.5 tabular-nums">
            <Row label="Sale price" value={price} />
            <Row label="Fees" value={fee === null ? null : -fee} />
            <Row label="Shipping & insurance" value={-shipping} />
            <Row label="Cost (purchase + parts)" value={costBasis === null ? null : -costBasis} />
            <div className="mt-1.5 flex items-baseline justify-between border-t border-border pt-2.5">
              <dt className="font-medium text-foreground">Profit</dt>
              <dd
                className={cn(
                  "text-base font-semibold",
                  profit === null ? "text-muted-foreground" : profit < 0 ? "text-critical-ink" : "text-foreground"
                )}
              >
                {profit === null ? "—" : formatCurrency(profit)}
                {margin !== null && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {formatPercentage(margin)} margin
                  </span>
                )}
              </dd>
            </div>
          </dl>
          {profit !== null && profit < 0 && (
            <p className="mt-2 text-xs text-critical-ink">This sale loses money at these numbers.</p>
          )}
        </div>

        <Textarea
          label="Notes"
          markOptional
          rows={2}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Buyer, tracking number, anything worth remembering"
        />
      </form>
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value === null ? "—" : formatCurrency(value === 0 ? 0 : value)}</dd>
    </div>
  );
}
