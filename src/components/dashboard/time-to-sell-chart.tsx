"use client";

import { ordinalBlue } from "@/lib/chart-theme";
import type { Dashboard } from "@/lib/dashboard/compute";
import { ChartCard } from "./chart-card";

/** How fast stock turns: ordered buckets on a single-hue ramp (slower = darker), median in the headline. */
export function TimeToSellChart({ data }: { data: Dashboard["reselling"]["timeToSell"] }) {
  const total = data.buckets.reduce((s, b) => s + b.count, 0);
  const max = Math.max(1, ...data.buckets.map((b) => b.count));

  return (
    <ChartCard
      title="Time to sell"
      description={
        data.median === null
          ? "Days from buying a watch to selling it."
          : `Half of the watches sold within ${Math.round(data.median)} days of buying them.`
      }
      table={{
        columns: [
          { key: "bucket", label: "Days to sell" },
          { key: "count", label: "Watches", align: "right" },
          { key: "share", label: "Share", align: "right" },
        ],
        rows: data.buckets.map((b) => ({
          bucket: b.label,
          count: b.count,
          share: total ? `${Math.round((b.count / total) * 100)}%` : "—",
        })),
      }}
    >
      {total === 0 ? (
        <p className="rounded-lg border border-dashed border-input/80 px-4 py-8 text-center text-sm text-muted-foreground">
          No sales in this period.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {data.buckets.map((b, i) => (
            <li key={b.label} className="grid grid-cols-[6.5rem_1fr_4rem] items-center gap-3 text-sm">
              <span className="text-muted-foreground">{b.label}</span>
              <span className="h-2" aria-hidden>
                <span
                  className="block h-full rounded-r-[4px]"
                  style={{ width: `${(b.count / max) * 100}%`, background: ordinalBlue[i] }}
                />
              </span>
              <span className="text-right tabular-nums text-foreground">
                {b.count}
                <span className="ml-1 text-xs text-muted-foreground">{Math.round((b.count / total) * 100)}%</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  );
}
