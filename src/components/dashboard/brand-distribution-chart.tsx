"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { foldOther, series } from "@/lib/chart-theme";
import { ChartEmpty } from "./chart-tooltip";

interface BrandCount {
  brand: string;
  count: number;
}

/** Ranked bars, one colour: comparing brands is about length, not hue. */
export function BrandDistributionChart({ data }: { data: BrandCount[] }) {
  const sorted = [...data].sort((a, b) => b.count - a.count);
  const rows = foldOther(
    sorted,
    (d) => d.count,
    (total, n) => ({ brand: `Other (${n} brands)`, count: total })
  );
  const max = Math.max(1, ...rows.map((r) => r.count));
  const total = sorted.reduce((s, r) => s + r.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock by brand</CardTitle>
        <CardDescription>Unsold watches, by count.</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <ChartEmpty height={160}>Add a watch to see your brand mix.</ChartEmpty>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {rows.map((r) => (
              <li key={r.brand} className="grid grid-cols-[7rem_1fr_2.5rem] items-center gap-3 text-sm">
                <span className="truncate text-foreground" title={r.brand}>
                  {r.brand}
                </span>
                <span className="h-2 rounded-r-[4px] bg-transparent" aria-hidden>
                  <span
                    className="block h-full rounded-r-[4px]"
                    style={{ width: `${(r.count / max) * 100}%`, background: series[0] }}
                    title={`${r.brand}: ${r.count} (${Math.round((r.count / total) * 100)}%)`}
                  />
                </span>
                <span className="text-right tabular-nums text-muted-foreground">{r.count}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
