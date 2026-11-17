"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { IconButton } from "@/components/ui/icon-button";
import { CreatableCombobox } from "@/components/ui/creatable-combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { apiPut, apiRequest, ApiError } from "@/lib/api-client";
import { invalidatePlatformFees, useSuggestions } from "@/hooks/use-form-data";
import type { PlatformFees } from "@/lib/platform-fees";

interface Row {
  key: number;
  name: string;
  /** What the user typed, in percent ("13" for 13%). */
  percent: string;
}

type RowErrors = Record<number, { name?: string; percent?: string }>;

let nextKey = 0;
const row = (name = "", percent = ""): Row => ({ key: nextKey++, name, percent });

/** 0.13 -> "13", without float noise like 13.000000000000002. */
const toPercentText = (rate: number) => String(Math.round(rate * 1_000_000) / 10_000);

function validate(rows: Row[]): { errors: RowErrors; fees: PlatformFees } {
  const errors: RowErrors = {};
  const fees: PlatformFees = {};
  const seen = new Set<string>();
  for (const r of rows) {
    const name = r.name.trim();
    const text = r.percent.trim();
    if (!name && !text) continue; // blank row: ignore
    const e: { name?: string; percent?: string } = {};
    if (!name) e.name = "Enter a platform name";
    else if (seen.has(name.toLowerCase())) e.name = "This platform is already listed";
    const pct = Number(text.replace(",", "."));
    if (!text) e.percent = "Enter a fee";
    else if (!Number.isFinite(pct) || pct < 0 || pct > 100) e.percent = "Use 0 to 100";
    if (e.name || e.percent) errors[r.key] = e;
    else fees[name] = Math.round(pct * 10_000) / 1_000_000;
    if (name) seen.add(name.toLowerCase());
  }
  return { errors, fees };
}

/** Default fee % per sales platform, used to prefill the fee when recording a sale. */
export function PlatformFeesCard() {
  const { toast } = useToast();
  const platforms = useSuggestions("platform");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [errors, setErrors] = useState<RowErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    apiRequest<PlatformFees>("/api/platform-fees")
      .catch(() => ({}) as PlatformFees)
      .then((fees) => {
        if (!alive) return;
        const loaded = Object.entries(fees).map(([name, rate]) => row(name, toPercentText(rate)));
        setRows(loaded.length > 0 ? loaded : [row()]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const update = (key: number, patch: Partial<Row>) => {
    setRows((prev) => prev?.map((r) => (r.key === key ? { ...r, ...patch } : r)) ?? prev);
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const remove = (key: number) => {
    setRows((prev) => prev?.filter((r) => r.key !== key) ?? prev);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!rows) return;
    const { errors: found, fees } = validate(rows);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSaving(true);
    try {
      await apiPut("/api/platform-fees", fees);
      invalidatePlatformFees();
      toast("Platform fees saved", "success");
    } catch (err) {
      toast(
        err instanceof ApiError || err instanceof Error ? err.message : "Couldn't save platform fees",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <form onSubmit={save} noValidate>
        <h2 className="text-sm font-medium text-muted-foreground">Platform fees</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Used to fill in the fee when you record a sale. You can always change it on the sale.
        </p>

        {rows === null ? (
          <div role="status" aria-label="Loading platform fees" className="mt-4 space-y-2">
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {rows.length > 0 && (
              <div
                aria-hidden
                className="grid grid-cols-[minmax(0,1fr)_7rem_2rem] gap-2 text-xs font-medium text-muted-foreground"
              >
                <span>Platform</span>
                <span>Fee</span>
              </div>
            )}
            {rows.map((r, i) => {
              const nameId = `platform-fee-name-${r.key}`;
              const pctId = `platform-fee-pct-${r.key}`;
              const label = r.name.trim() || `row ${i + 1}`;
              return (
                <div key={r.key} className="grid grid-cols-[minmax(0,1fr)_7rem_2rem] items-start gap-2">
                  <div>
                    <label htmlFor={nameId} className="sr-only">
                      Platform name, row {i + 1}
                    </label>
                    <CreatableCombobox
                      id={nameId}
                      suggestions={platforms}
                      value={r.name}
                      onValueChange={(v) => update(r.key, { name: v })}
                      placeholder="e.g. eBay"
                      error={errors[r.key]?.name}
                    />
                  </div>
                  <div>
                    <label htmlFor={pctId} className="sr-only">
                      Fee percent for {label}
                    </label>
                    <div className="relative">
                      <Input
                        id={pctId}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        max={100}
                        step="0.01"
                        value={r.percent}
                        onChange={(e) => update(r.key, { percent: e.target.value })}
                        placeholder="0"
                        error={errors[r.key]?.percent}
                        className="pr-7 text-right tabular-nums"
                      />
                      <span
                        aria-hidden
                        className="pointer-events-none absolute right-3 top-[1.125rem] -translate-y-1/2 text-sm text-muted-foreground"
                      >
                        %
                      </span>
                    </div>
                  </div>
                  <IconButton
                    aria-label={`Remove ${label}`}
                    className="mt-0.5"
                    onClick={() => remove(r.key)}
                  >
                    <X />
                  </IconButton>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={rows === null}
            onClick={() => setRows((prev) => [...(prev ?? []), row()])}
          >
            <Plus />
            Add platform
          </Button>
          <Button type="submit" disabled={saving || rows === null}>
            {saving ? "Saving…" : "Save platform fees"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
