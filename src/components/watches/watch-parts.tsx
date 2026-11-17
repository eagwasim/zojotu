"use client";

import { useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { CreatableCombobox } from "@/components/ui/creatable-combobox";
import { DateInput, isoDate } from "@/components/ui/date-input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { apiDelete, apiPost, ApiError } from "@/lib/api-client";
import { PART_CATEGORIES, partSchema } from "@/lib/validators/part";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  fieldErrors,
  invalidateSuggestions,
  serverFieldErrors,
  useSuggestions,
  withoutKey,
} from "@/hooks/use-form-data";

export interface WatchPart {
  id: number;
  description: string;
  category: string;
  cost: number;
  date: string;
  supplier?: string | null;
}

const CATEGORY_KEY = "part-form:category";

interface WatchPartsProps {
  watchId: number;
  parts: WatchPart[];
  onChange: () => void;
  /** Hide the add row (e.g. once sold, though adding is still allowed). */
  readOnly?: boolean;
}

/** Parts & mods for one watch, with an inline add row: watch and date are already known. */
export function WatchParts({ watchId, parts, onChange, readOnly }: WatchPartsProps) {
  const { toast } = useToast();
  const suppliers = useSuggestions("supplier");
  const descRef = useRef<HTMLInputElement>(null);

  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(() =>
    typeof window === "undefined" ? "Hardware" : sessionStorage.getItem(CATEGORY_KEY) || "Hardware"
  );
  const [cost, setCost] = useState<number | null>(null);
  const [supplier, setSupplier] = useState("");
  const [date, setDate] = useState(isoDate());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [rowKey, setRowKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<WatchPart | null>(null);

  const total = parts.reduce((s, p) => s + p.cost, 0);

  const add = async () => {
    const data = {
      watchId,
      date,
      description,
      category,
      cost: cost ?? NaN,
      supplier: supplier || undefined,
    };
    const parsed = partSchema.safeParse(data);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setSaving(true);
    try {
      await apiPost("/api/parts", parsed.data);
      sessionStorage.setItem(CATEGORY_KEY, category);
      invalidateSuggestions();
      // Keep supplier, category and date for the next part from the same order.
      setDescription("");
      setCost(null);
      setErrors({});
      setRowKey((k) => k + 1);
      onChange();
      requestAnimationFrame(() => descRef.current?.focus());
    } catch (e) {
      const fe = e instanceof ApiError ? serverFieldErrors(e.body) : {};
      if (Object.keys(fe).length) setErrors(fe);
      toast(e instanceof Error ? e.message : "Couldn't add the part", "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await apiDelete(`/api/parts/${deleteTarget.id}`);
      onChange();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't delete the part", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  const clear = (key: string) => errors[key] && setErrors((prev) => withoutKey(prev, key));

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <CardTitle>Parts &amp; mods</CardTitle>
          <CardDescription>
            {parts.length === 0
              ? "Nothing added yet. Parts count towards this watch's cost."
              : `${parts.length} item${parts.length === 1 ? "" : "s"}, ${formatCurrency(total)} in total`}
          </CardDescription>
        </div>
      </CardHeader>

      {parts.length > 0 && (
        <ul className="mt-4 flex flex-col divide-y divide-border">
          {parts.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{p.description}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {[p.category, p.supplier, formatDate(p.date)].filter(Boolean).join(" · ")}
                </p>
              </div>
              <span className="text-sm tabular-nums text-foreground">{formatCurrency(p.cost)}</span>
              <IconButton aria-label={`Delete ${p.description}`} tone="destructive" size="sm" onClick={() => setDeleteTarget(p)}>
                <Trash2 />
              </IconButton>
            </li>
          ))}
        </ul>
      )}

      {!readOnly && (
        <form
          key={rowKey}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
          className="mt-4 flex flex-col gap-3 rounded-lg bg-secondary/60 p-4"
          aria-label="Add a part"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_9rem_8rem]">
            <Input
              ref={descRef}
              label="Part or mod"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                clear("description");
              }}
              placeholder="Sapphire crystal"
              error={errors.description}
            />
            <Select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={PART_CATEGORIES.map((c) => ({ value: c, label: c }))}
              placeholder={false}
              error={errors.category}
            />
            <CurrencyInput
              label="Cost"
              value={cost}
              onValueChange={(v) => {
                setCost(v);
                clear("cost");
              }}
              error={errors.cost}
            />
          </div>
          <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-[1fr_12rem_auto]">
            <CreatableCombobox
              label="Supplier"
              markOptional
              suggestions={suppliers}
              value={supplier}
              onValueChange={setSupplier}
              placeholder="AliExpress, Crystaltimes…"
            />
            <DateInput label="Date" value={date} onValueChange={setDate} quickPicks={false} />
            <Button type="submit" disabled={saving} className="sm:mt-6">
              <Plus />
              {saving ? "Adding…" : "Add part"}
            </Button>
          </div>
        </form>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        title="Delete part"
        message={`Delete "${deleteTarget?.description}"? Its cost will no longer count towards this watch.`}
      />
    </Card>
  );
}
