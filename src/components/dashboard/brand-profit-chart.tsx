"use client";

import { foldOther, series } from "@/lib/chart-theme";
import { cn, formatCurrency } from "@/lib/utils";
import type { BrandRow } from "@/lib/dashboard/compute";
import { ChartCard } from "./chart-card";

/** Ranked bars, one colour, top 7 + Other. Value at the bar tip. */
export function BrandProfitChart({ data }: { data: BrandRow[] }) {
  const rows = foldOther(
    data,
    (b) => b.profit,
    (profit, n) => ({ brand: `${n} other brands`, sold: 0, profit, avgProfit: 0 })
  );
  const max = Math.max(1, ...rows.map((r) => Math.abs(r.profit)));

  return (
    <ChartCard
      title="Most profitable brands"
      description="Profit from watches sold in this period, after fees."
      table={{
        columns: [
          { key: "brand", label: "Brand" },
          { key: "sold", label: "Sold", align: "right" },
          { key: "profit", label: "Profit", align: "right" },
          { key: "avg", label: "Per watch", align: "right" },
        ],
        rows: data.map((b) => ({
          brand: b.brand,
          sold: b.sold,
          profit: formatCurrency(b.profit),
          avg: formatCurrency(b.avgProfit),
        })),
      }}
    >
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-input/80 px-4 py-8 text-center text-sm text-muted-foreground">
          No sales in this period.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {rows.map((r) => (
            <li
              key={r.brand}
              className="grid grid-cols-[7rem_1fr_5.5rem] items-center gap-3 text-sm"
              title={r.sold ? `${r.brand}: ${r.sold} sold, ${formatCurrency(r.avgProfit)} each on average` : r.brand}
            >
              <span className="truncate text-foreground">{r.brand}</span>
              <span className="h-2" aria-hidden>
                <span
                  className="block h-full rounded-r-[4px]"
                  style={{ width: `${(Math.max(0, r.profit) / max) * 100}%`, background: series[0] }}
                />
              </span>
              <span className={cn("text-right tabular-nums text-foreground", r.profit < 0 && "text-critical-ink")}>
                {formatCurrency(r.profit)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  );
}
