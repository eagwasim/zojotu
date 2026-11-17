"use client";

import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { series } from "@/lib/chart-theme";
import { cn, formatCurrency, formatPercentage } from "@/lib/utils";
import type { PlatformRow } from "@/lib/dashboard/compute";

/**
 * Platforms compared on what matters: profit (inline bar) and margin, with fee rate beside.
 * A table with inline bars, not a multi-series chart: every number is visible.
 */
export function PlatformTable({ rows, className }: { rows: PlatformRow[]; className?: string }) {
  const maxProfit = Math.max(1, ...rows.map((r) => Math.abs(r.profit)));
  const best = rows.filter((r) => r.margin !== null).sort((a, b) => b.margin! - a.margin!)[0];

  return (
    <Card className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col gap-1">
        <CardTitle>Where it sells best</CardTitle>
        <CardDescription>
          {best && rows.length > 1
            ? `${best.platform} has the best margin at ${formatPercentage(best.margin!)}.`
            : "Profit after fees and shipping, by sales platform."}
        </CardDescription>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-input/80 px-4 py-8 text-center text-sm text-muted-foreground">
          No sales in this period.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th scope="col" className="py-2 pr-4 text-left font-medium">Platform</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">Sold</th>
                <th scope="col" className="hidden py-2 pr-4 text-right font-medium sm:table-cell">Revenue</th>
                <th scope="col" className="py-2 pr-4 text-left font-medium">Profit</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">Margin</th>
                <th scope="col" className="hidden py-2 text-right font-medium sm:table-cell">Fees</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.platform} className="border-b border-border last:border-0">
                  <td className="py-2.5 pr-4">
                    <Link
                      href={`/sales?platform=${encodeURIComponent(r.platform)}`}
                      className="text-foreground hover:underline"
                    >
                      {r.platform}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-4 text-right tabular-nums text-muted-foreground">{r.sold}</td>
                  <td className="hidden py-2.5 pr-4 text-right tabular-nums text-muted-foreground sm:table-cell">
                    {formatCurrency(r.revenue)}
                  </td>
                  <td className="w-[40%] py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2 flex-1" aria-hidden>
                        <span
                          className="block h-full rounded-r-[4px]"
                          style={{
                            width: `${(Math.max(0, r.profit) / maxProfit) * 100}%`,
                            background: series[0],
                          }}
                        />
                      </span>
                      <span className={cn("w-20 text-right tabular-nums", r.profit < 0 && "text-critical-ink")}>
                        {formatCurrency(r.profit)}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">
                    {r.margin === null ? "—" : formatPercentage(r.margin)}
                  </td>
                  <td className="hidden py-2.5 text-right tabular-nums text-muted-foreground sm:table-cell">
                    {r.feeRate === null ? "—" : formatPercentage(r.feeRate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
