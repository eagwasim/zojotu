"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DateInput, isoDate } from "@/components/ui/date-input";
import { CreatableCombobox } from "@/components/ui/creatable-combobox";
import { useToast } from "@/components/ui/toast";
import { apiPut } from "@/lib/api-client";
import { estimateFee, feeRateFor } from "@/lib/platform-fees";
import { cn, formatCurrency, formatPercentage } from "@/lib/utils";
import { invalidateSuggestions, usePlatformFees, useSuggestions } from "@/hooks/use-form-data";

interface ListWatchDialogProps {
  open: boolean;
  onClose: () => void;
  watch: {
    id: number;
    status: string;
    askingPrice?: number | null;
    listedPlatform?: string | null;
    listedDate?: string | null;
  };
  /** Purchase + parts, for the expected-profit preview. */
  costBasis: number;
  onSaved: () => void;
}

/** "Mark as listed" / "Edit listing": asking price, platform, date, with expected profit. */
export function ListWatchDialog({ open, onClose, watch, costBasis, onSaved }: ListWatchDialogProps) {
  const { toast } = useToast();
  const platforms = useSuggestions("platform");
  const fees = usePlatformFees();
  const editing = watch.status === "Listed";

  const [ask, setAsk] = useState<number | null>(null);
  const [platform, setPlatform] = useState("");
  const [date, setDate] = useState(isoDate());
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const openKey = open ? `open:${watch.id}` : "closed";
  const [lastKey, setLastKey] = useState(openKey);
  if (openKey !== lastKey) {
    setLastKey(openKey);
    if (open) {
      setAsk(watch.askingPrice ?? null);
      setPlatform(watch.listedPlatform ?? "");
      setDate(watch.listedDate ?? isoDate());
      setError(undefined);
    }
  }

  const rate = feeRateFor(fees, platform);
  const fee = ask !== null && rate !== null ? estimateFee(ask, rate) : 0;
  const expected = ask !== null ? ask - fee - costBasis : null;

  const save = async () => {
    if (ask === null || ask <= 0) {
      setError("Enter the asking price");
      return;
    }
    setSaving(true);
    try {
      await apiPut(`/api/watches/${watch.id}`, {
        status: "Listed",
        askingPrice: ask,
        listedPlatform: platform || null,
        listedDate: date,
      });
      invalidateSuggestions();
      toast(editing ? "Listing updated" : "Marked as listed", "success");
      onSaved();
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't save the listing", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Edit listing" : "Mark as listed"}
      description="Used for expected profit and to flag listings that sit too long."
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <CurrencyInput
            label="Asking price"
            required
            autoFocus
            value={ask}
            onValueChange={(v) => {
              setAsk(v);
              setError(undefined);
            }}
            error={error}
          />
          <DateInput label="Listed" value={date} onValueChange={setDate} quickPicks={false} />
        </div>
        <CreatableCombobox
          label="Listed on"
          markOptional
          suggestions={platforms}
          value={platform}
          onValueChange={setPlatform}
          placeholder="eBay, Chrono24…"
          hint={rate !== null ? `${formatPercentage(rate)} fee` : undefined}
        />

        <dl className="flex flex-col gap-1.5 rounded-lg bg-secondary/60 p-4 text-sm tabular-nums">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Cost (purchase + parts)</dt>
            <dd>{formatCurrency(costBasis)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Estimated fee</dt>
            <dd>{rate === null ? "—" : formatCurrency(fee)}</dd>
          </div>
          <div className="mt-1 flex items-baseline justify-between border-t border-border pt-2">
            <dt className="font-medium">Expected profit</dt>
            <dd className={cn("font-semibold", expected !== null && expected < 0 && "text-critical-ink")}>
              {expected === null ? "—" : formatCurrency(expected)}
              {expected !== null && ask ? (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {formatPercentage(expected / ask)} margin
                </span>
              ) : null}
            </dd>
          </div>
          <p className="text-xs text-muted-foreground">Before shipping, which is added when you record the sale.</p>
        </dl>

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : editing ? "Save listing" : "Mark as listed"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
