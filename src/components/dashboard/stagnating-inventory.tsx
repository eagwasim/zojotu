"use client";

import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
        <CardTitle>Slow-moving stock</CardTitle>
        <CardDescription>Unsold for more than 90 days. Consider a price drop or relisting.</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="flex h-40 items-center justify-center rounded-lg border border-dashed border-input/80 text-sm text-muted-foreground">
            Nothing has been sitting for more than 90 days.
          </p>
        ) : (
          <ul className="-mx-2 flex flex-col">
            {data.map((watch) => (
              <li key={watch.id}>
                <Link
                  href={`/inventory/${watch.id}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors duration-150 hover:bg-accent/60"
                >
                  <AlertTriangle className="size-4 shrink-0 text-warning-ink" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">{watch.brand}</span>
                    <span className="block truncate text-xs text-muted-foreground">{watch.model}</span>
                  </span>
                  <Badge tone="warning" className="tabular-nums">
                    {watch.daysInInventory} days
                  </Badge>
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
