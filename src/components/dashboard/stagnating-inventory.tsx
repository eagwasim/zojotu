"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface StagnatingWatch {
  id: number;
  brand: string;
  model: string;
  daysInInventory: number;
}

export function StagnatingInventory({ data }: { data: StagnatingWatch[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Stagnating Inventory (&gt;90 days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
            No stagnating watches
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((watch) => (
              <div
                key={watch.id}
                className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {watch.brand}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {watch.model}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-amber-500">
                  {watch.daysInInventory}d
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
