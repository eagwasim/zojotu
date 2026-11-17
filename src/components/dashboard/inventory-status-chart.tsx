"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { chrome, series } from "@/lib/chart-theme";
import { ChartEmpty } from "./chart-tooltip";

interface StatusData {
  status: string;
  count: number;
}

// Same stage colours as StatusBadge, in lifecycle order.
const STAGES = [
  { status: "In Inventory", color: series[0] },
  { status: "Modding", color: series[3] },
  { status: "Listed", color: series[2] },
  { status: "Sold", color: chrome.other },
];

/** Part-to-whole across four stages: one segmented bar with a labelled legend, not a donut. */
export function InventoryStatusChart({ data }: { data: StatusData[] }) {
  const counts = new Map(data.map((d) => [d.status, d.count]));
  const rows = [
    ...STAGES.map((s) => ({ ...s, count: counts.get(s.status) ?? 0 })),
    ...data
      .filter((d) => !STAGES.some((s) => s.status === d.status))
      .map((d) => ({ status: d.status, color: chrome.other, count: d.count })),
  ];
  const total = rows.reduce((s, r) => s + r.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Watches by stage</CardTitle>
        <CardDescription>{total} watches tracked in total.</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <ChartEmpty height={160}>Add a watch to start tracking stock.</ChartEmpty>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full" role="img" aria-label={rows.map((r) => `${r.status} ${r.count}`).join(", ")}>
              {rows
                .filter((r) => r.count > 0)
                .map((r) => (
                  <div
                    key={r.status}
                    title={`${r.status}: ${r.count}`}
                    className="h-full first:rounded-l-full last:rounded-r-full"
                    style={{ width: `${(r.count / total) * 100}%`, background: r.color }}
                  />
                ))}
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
              {rows.map((r) => (
                <div key={r.status} className="flex flex-col gap-0.5">
                  <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span aria-hidden className="size-2 rounded-full" style={{ background: r.color }} />
                    {r.status}
                  </dt>
                  <dd className="text-lg font-semibold tabular-nums text-foreground">
                    {r.count}
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      {Math.round((r.count / total) * 100)}%
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
