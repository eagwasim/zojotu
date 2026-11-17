"use client";

import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { chrome, ordinalBlue, series } from "@/lib/chart-theme";
import { cn, formatCurrency } from "@/lib/utils";
import type { Dashboard } from "@/lib/dashboard/compute";

// Same stage colours as StatusBadge.
const STAGE_COLOR: Record<string, string> = {
  "In Inventory": series[0],
  Modding: series[3],
  Listed: series[2],
  Other: chrome.other,
};

/** "Where is my money?": cash tied up in unsold stock, by stage and by age, plus what listed stock should bring in. */
export function StockPanel({ stock, className }: { stock: Dashboard["stock"]; className?: string }) {
  const stages = stock.byStage.filter((s) => s.count > 0);
  const maxAge = Math.max(1, ...stock.aging.map((a) => a.cost));

  return (
    <Card className={cn("flex flex-col gap-6", className)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <CardTitle>Where your money is</CardTitle>
          <CardDescription>Unsold stock at cost (purchase + parts), as of today.</CardDescription>
        </div>
        <p className="text-right">
          <span className="block text-[1.75rem] font-semibold leading-none tracking-tight text-foreground">
            {formatCurrency(stock.cost)}
          </span>
          <span className="text-xs text-muted-foreground">
            in {stock.count} watch{stock.count === 1 ? "" : "es"}
          </span>
        </p>
      </div>

      {stock.count === 0 ? (
        <p className="rounded-lg border border-dashed border-input/80 px-4 py-8 text-center text-sm text-muted-foreground">
          No unsold stock. <Link href="/inventory?new=1" className="font-medium text-link hover:underline">Add a watch</Link>
        </p>
      ) : (
        <>
          {/* By stage: one segmented bar (≤4 parts), labelled underneath. */}
          <div className="flex flex-col gap-3">
            <div
              className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full"
              role="img"
              aria-label={stages.map((s) => `${s.status} ${formatCurrency(s.cost)}`).join(", ")}
            >
              {stages.map((s) => (
                <div
                  key={s.status}
                  title={`${s.status}: ${formatCurrency(s.cost)}`}
                  className="h-full"
                  style={{ width: `${(s.cost / (stock.cost || 1)) * 100}%`, background: STAGE_COLOR[s.status] }}
                />
              ))}
            </div>
            <dl className="grid grid-cols-3 gap-4">
              {stock.byStage
                .filter((s) => s.status !== "Other" || s.count > 0)
                .map((s) => (
                  <div key={s.status} className="flex flex-col gap-0.5">
                    <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span aria-hidden className="size-2 rounded-full" style={{ background: STAGE_COLOR[s.status] }} />
                      {s.status}
                    </dt>
                    <dd className="text-base font-semibold tabular-nums text-foreground">
                      {formatCurrency(s.cost)}
                    </dd>
                    <dd className="text-xs tabular-nums text-muted-foreground">
                      {s.count} watch{s.count === 1 ? "" : "es"}
                    </dd>
                  </div>
                ))}
            </dl>
          </div>

          <div className="grid grid-cols-1 gap-6 border-t border-border pt-5 md:grid-cols-2">
            {/* Listed stock: what it should bring in. */}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-foreground">Listed stock</p>
              <dl className="flex flex-col gap-1.5 text-sm tabular-nums">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Asking prices</dt>
                  <dd>{formatCurrency(stock.listed.asking)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Expected profit</dt>
                  <dd className={cn("font-semibold", stock.listed.expectedProfit < 0 && "text-critical-ink")}>
                    {formatCurrency(stock.listed.expectedProfit)}
                  </dd>
                </div>
              </dl>
              <p className="text-xs text-muted-foreground">
                After estimated platform fees, before shipping.
                {stock.listed.withoutAsk > 0 &&
                  ` ${stock.listed.withoutAsk} listed watch${stock.listed.withoutAsk === 1 ? " has" : "es have"} no asking price and ${stock.listed.withoutAsk === 1 ? "isn't" : "aren't"} counted.`}
              </p>
            </div>

            {/* Aging: ordered buckets, single-hue ramp, older = darker. */}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-foreground">How long it&rsquo;s been sitting</p>
              <ul className="flex flex-col gap-2">
                {stock.aging.map((a, i) => (
                  <li key={a.label} className="grid grid-cols-[6.5rem_1fr_4.5rem] items-center gap-3 text-xs">
                    <span className="text-muted-foreground">{a.label}</span>
                    <span className="h-2" aria-hidden>
                      <span
                        className="block h-full rounded-r-[4px]"
                        style={{ width: `${(a.cost / maxAge) * 100}%`, background: ordinalBlue[i] }}
                      />
                    </span>
                    <span className="text-right tabular-nums text-foreground" title={`${a.count} watches`}>
                      {formatCurrency(a.cost)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
