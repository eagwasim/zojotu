"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import type { PlatformPerformance } from "@/lib/queries/dashboard";

/** Fee rates above this are flagged. */
const HIGH_FEE = 0.1;

export function MarginInsights({ data }: { data: PlatformPerformance }) {
  const recommendations = data.revenueByPlatform
    .filter((p) => p.margin > 0.15)
    .sort((a, b) => b.margin - a.margin)
    .slice(0, 2);

  const byFee = data.revenueByPlatform
    .map((p) => ({ ...p, feeRatio: p.revenue > 0 ? p.fees / p.revenue : 0 }))
    .sort((a, b) => b.feeRatio - a.feeRatio);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Fees</CardTitle>
          <CardDescription>
            {formatPercentage(data.feePercentage)} of revenue, {formatCurrency(data.totalFees)} in total.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {byFee.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {byFee.map((p) => (
                <li key={p.platform} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-foreground">{p.platform}</span>
                  <span className="flex items-center gap-2 tabular-nums">
                    {p.feeRatio > HIGH_FEE && (
                      <span className="rounded-full bg-serious-wash px-2 py-0.5 text-xs font-medium text-serious-ink">
                        High
                      </span>
                    )}
                    <span className="text-muted-foreground">{formatPercentage(p.feeRatio)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Where to sell</CardTitle>
          <CardDescription>Platforms with a margin above 15%.</CardDescription>
        </CardHeader>
        <CardContent>
          {recommendations.length > 0 ? (
            <ul className="flex flex-col gap-4">
              {recommendations.map((p) => (
                <li key={p.platform} className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium text-foreground">
                    {p.platform}: {formatPercentage(p.margin)} margin
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Consider listing more of your higher-value stock here.
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No platform is above 15% margin yet. Suggestions appear as more sales come in.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
