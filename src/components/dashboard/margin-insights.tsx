"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, Percent, Info } from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import type { PlatformPerformance } from "@/lib/queries/dashboard";

export function MarginInsights({ data }: { data: PlatformPerformance }) {
  const recommendations = data.revenueByPlatform
    .filter(p => p.margin > 0.15) // High margin platforms
    .sort((a, b) => b.margin - a.margin)
    .slice(0, 2);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Fee Impact Analysis
          </CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPercentage(data.feePercentage)}</div>
          <p className="text-xs text-muted-foreground">
            Total fees: {formatCurrency(data.totalFees)}
          </p>
          <div className="mt-4 space-y-2">
            {data.revenueByPlatform.slice(0, 3).map((p) => {
              const feeRatio = p.revenue > 0 ? p.fees / p.revenue : 0;
              return (
                <div key={p.platform} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{p.platform}</span>
                  <span className={feeRatio > 0.1 ? "text-red-400" : "text-green-400"}>
                    {formatPercentage(feeRatio)} fee rate
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Strategic Recommendations
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {recommendations.length > 0 ? (
            <div className="space-y-4">
              {recommendations.map((p, i) => (
                <div key={p.platform} className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Info className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Prioritize {p.platform}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Delivers {formatPercentage(p.margin)} net margin. Consider moving more high-value inventory here.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
              Collect more data for recommendations
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
