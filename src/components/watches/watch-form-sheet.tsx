"use client";

import { useRef, useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DateInput, isoDate } from "@/components/ui/date-input";
import { CreatableCombobox } from "@/components/ui/creatable-combobox";
import { Kbd } from "@/components/ui/kbd";
import { useToast } from "@/components/ui/toast";
import { apiPost, apiPut, ApiError } from "@/lib/api-client";
import {
  CONDITIONS,
  MOVEMENTS,
  SETTABLE_STATUSES,
  isClosedStatus,
  watchSchema,
} from "@/lib/validators/watch";
import {
  fieldErrors,
  withoutKey,
  invalidateSuggestions,
  serverFieldErrors,
  useSuggestions,
} from "@/hooks/use-form-data";

export interface WatchRecord {
  id: number;
  brand: string;
  model: string;
  reference?: string | null;
  serial?: string | null;
  movementType: string;
  condition?: string | null;
  acquisitionDate: string;
  source: string;
  baseCost: number;
  status: string;
  notes?: string | null;
  askingPrice?: number | null;
  listedDate?: string | null;
  listedPlatform?: string | null;
  writtenOffDate?: string | null;
  writtenOffReason?: string | null;
}

interface FormState {
  brand: string;
  model: string;
  reference: string;
  serial: string;
  movementType: string;
  condition: string;
  acquisitionDate: string;
  source: string;
  baseCost: number | null;
  status: string;
  notes: string;
  askingPrice: number | null;
  listedDate: string;
  listedPlatform: string;
}

// Remembered between adds in this browser session, so a batch from one seller is quick.
const MEMORY_KEY = "watch-form:last";
type Memory = Pick<FormState, "movementType" | "source" | "status" | "acquisitionDate">;

function readMemory(): Partial<Memory> {
  try {
    return JSON.parse(sessionStorage.getItem(MEMORY_KEY) || "{}");
  } catch {
    return {};
  }
}

function blank(memory: Partial<Memory> = {}): FormState {
  return {
    brand: "",
    model: "",
    reference: "",
    serial: "",
    movementType: memory.movementType ?? "Automatic",
    condition: "",
    acquisitionDate: memory.acquisitionDate ?? isoDate(),
    source: memory.source ?? "",
    baseCost: null,
    status: memory.status ?? "In Inventory",
    notes: "",
    askingPrice: null,
    listedDate: "",
    listedPlatform: "",
  };
}

function fromWatch(w: WatchRecord): FormState {
  return {
    brand: w.brand,
    model: w.model,
    reference: w.reference ?? "",
    serial: w.serial ?? "",
    movementType: w.movementType,
    condition: w.condition ?? "",
    acquisitionDate: w.acquisitionDate,
    source: w.source,
    baseCost: w.baseCost,
    status: w.status,
    notes: w.notes ?? "",
    askingPrice: w.askingPrice ?? null,
    listedDate: w.listedDate ?? "",
    listedPlatform: w.listedPlatform ?? "",
  };
}

function toPayload(f: FormState) {
  const listed = f.status === "Listed";
  return {
    brand: f.brand,
    model: f.model,
    reference: f.reference || null,
    serial: f.serial || null,
    movementType: f.movementType,
    condition: f.condition || null,
    acquisitionDate: f.acquisitionDate,
    source: f.source,
    baseCost: f.baseCost ?? undefined,
    status: f.status,
    notes: f.notes || null,
    askingPrice: f.askingPrice,
    // Only send listing details when listed; otherwise keep whatever is stored.
    ...(listed
      ? { listedDate: f.listedDate || undefined, listedPlatform: f.listedPlatform || null }
      : {}),
  };
}

interface WatchFormSheetProps {
  open: boolean;
  onClose: () => void;
  /** Edit this watch; omit to add a new one. */
  watch?: WatchRecord | null;
  onSaved?: (watch: WatchRecord) => void;
}

export function WatchFormSheet({ open, onClose, watch, onSaved }: WatchFormSheetProps) {
  const { toast } = useToast();
  const brands = useSuggestions("brand");
  const sources = useSuggestions("source");
  const platforms = useSuggestions("platform");
  const editing = !!watch;
  // Sold and written-off watches keep their status; it's changed from the watch page.
  const closedStatus = watch && isClosedStatus(watch.status) ? watch.status : null;

  const [form, setForm] = useState<FormState>(() => blank());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const firstFieldRef = useRef<HTMLDivElement>(null);

  // Reset whenever the sheet opens (or switches to a different watch).
  const openKey = open ? `open:${watch?.id ?? "new"}` : "closed";
  const [lastOpenKey, setLastOpenKey] = useState(openKey);
  if (openKey !== lastOpenKey) {
    setLastOpenKey(openKey);
    if (open) {
      setForm(watch ? fromWatch(watch) : blank(readMemory()));
      setErrors({});
      setFormKey((k) => k + 1);
    }
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((prev) => withoutKey(prev, key));
  };

  const save = async (another: boolean) => {
    const payload = toPayload(form);
    const parsed = watchSchema.safeParse({
      ...payload,
      baseCost: payload.baseCost ?? NaN,
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setSaving(true);
    try {
      const saved = editing
        ? await apiPut<WatchRecord>(`/api/watches/${watch!.id}`, payload)
        : await apiPost<WatchRecord>("/api/watches", payload);
      invalidateSuggestions();
      if (!editing) {
        sessionStorage.setItem(
          MEMORY_KEY,
          JSON.stringify({
            movementType: form.movementType,
            source: form.source,
            status: form.status,
            acquisitionDate: form.acquisitionDate,
          } satisfies Memory)
        );
      }
      toast(
        editing ? "Watch updated" : `${saved.brand} ${saved.model} added`,
        "success"
      );
      onSaved?.(saved);
      if (another) {
        setForm(blank(readMemory()));
        setErrors({});
        setFormKey((k) => k + 1);
        requestAnimationFrame(() => firstFieldRef.current?.querySelector("input")?.focus());
      } else {
        onClose();
      }
    } catch (e) {
      const fe = e instanceof ApiError ? serverFieldErrors(e.body) : {};
      if (Object.keys(fe).length) setErrors(fe);
      toast(e instanceof Error ? e.message : "Couldn't save the watch", "error");
    } finally {
      setSaving(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      save(false);
    }
  };

  const statusOptions = closedStatus
    ? [{ value: closedStatus, label: closedStatus }]
    : SETTABLE_STATUSES.map((s) => ({ value: s, label: s }));

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? "Edit watch" : "Add watch"}
      description={editing ? `${watch!.brand} ${watch!.model}` : "Required fields are marked. Everything else can be added later."}
      className="max-w-lg"
      footer={
        <>
          <span className="mr-auto hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
            <Kbd>⌘</Kbd>
            <Kbd>↵</Kbd> to save
          </span>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          {!editing && (
            <Button variant="secondary" onClick={() => save(true)} disabled={saving}>
              Save &amp; add another
            </Button>
          )}
          <Button type="submit" form="watch-form" disabled={saving}>
            {saving ? "Saving…" : editing ? "Save changes" : "Add watch"}
          </Button>
        </>
      }
    >
      <form
        id="watch-form"
        key={formKey}
        noValidate
        onKeyDown={onKeyDown}
        onSubmit={(e) => {
          e.preventDefault();
          save(false);
        }}
        className="flex flex-col gap-6"
      >
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            The watch
          </legend>
          <div className="grid grid-cols-2 gap-4" ref={firstFieldRef}>
            <CreatableCombobox
              label="Brand"
              required
              suggestions={brands}
              value={form.brand}
              onValueChange={(v) => set("brand", v)}
              placeholder="Seiko"
              error={errors.brand}
            />
            <Input
              label="Model"
              required
              value={form.model}
              onChange={(e) => set("model", e.target.value)}
              placeholder="SKX007"
              error={errors.model}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Movement"
              value={form.movementType}
              onChange={(e) => set("movementType", e.target.value)}
              options={MOVEMENTS.map((m) => ({ value: m, label: m }))}
              placeholder={false}
              error={errors.movementType}
            />
            <Select
              label="Condition"
              value={form.condition}
              onChange={(e) => set("condition", e.target.value)}
              options={CONDITIONS.map((c) => ({ value: c, label: c }))}
              placeholder="Not set"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Reference"
              markOptional
              value={form.reference}
              onChange={(e) => set("reference", e.target.value)}
              placeholder="SKX007K2"
            />
            <Input
              label="Serial"
              markOptional
              value={form.serial}
              onChange={(e) => set("serial", e.target.value)}
            />
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Purchase
          </legend>
          <div className="grid grid-cols-2 gap-4">
            <CurrencyInput
              label="Paid"
              required
              value={form.baseCost}
              onValueChange={(v) => set("baseCost", v)}
              error={errors.baseCost}
            />
            <DateInput
              label="Acquired"
              value={form.acquisitionDate}
              onValueChange={(v) => set("acquisitionDate", v)}
              error={errors.acquisitionDate}
            />
          </div>
          <CreatableCombobox
            label="Bought from"
            required
            suggestions={sources}
            value={form.source}
            onValueChange={(v) => set("source", v)}
            placeholder="eBay, a private seller, Chrono24…"
            error={errors.source}
          />
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Status
          </legend>
          <Select
            label="Stage"
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
            options={statusOptions}
            placeholder={false}
            disabled={!!closedStatus}
            hint={
              closedStatus === "Sold"
                ? "Sold comes from the sale record. Delete the sale to change it."
                : closedStatus
                  ? "Restore it to stock from the watch page to change it."
                  : undefined
            }
          />
          {form.status === "Listed" && (
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-secondary/60 p-4">
              <CurrencyInput
                label="Asking price"
                value={form.askingPrice}
                onValueChange={(v) => set("askingPrice", v)}
                error={errors.askingPrice}
              />
              <CreatableCombobox
                label="Listed on"
                suggestions={platforms}
                value={form.listedPlatform}
                onValueChange={(v) => set("listedPlatform", v)}
                placeholder="eBay"
              />
              <DateInput
                label="Listed"
                className="col-span-2"
                value={form.listedDate || isoDate()}
                onValueChange={(v) => set("listedDate", v)}
                error={errors.listedDate}
              />
            </div>
          )}
        </fieldset>

        <Textarea
          label="Notes"
          markOptional
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Condition details, service history, what it needs…"
        />
      </form>
    </Sheet>
  );
}
