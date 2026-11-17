"use client";

import { useState } from "react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface TableView {
  columns: { key: string; label: string; align?: "left" | "right" }[];
  rows: Record<string, React.ReactNode>[];
}

interface ChartCardProps {
  title: string;
  description?: React.ReactNode;
  /** Right side of the header (legend, badge). */
  aside?: React.ReactNode;
  /** Every chart has a table view, so no value is only reachable by hovering. */
  table?: TableView;
  className?: string;
  children: React.ReactNode;
}

export function ChartCard({ title, description, aside, table, className, children }: ChartCardProps) {
  const [view, setView] = useState<"chart" | "table">("chart");
  return (
    <Card className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <div className="flex items-center gap-3">
          {view === "chart" && aside}
          {table && (
            <div role="radiogroup" aria-label={`${title}: view as`} className="inline-flex rounded-md bg-secondary p-0.5">
              {(["chart", "table"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={view === v}
                  onClick={() => setView(v)}
                  className={cn(
                    "h-6 rounded px-2 text-xs font-medium capitalize transition-[background-color,color,box-shadow] duration-150",
                    view === v ? "bg-card text-foreground shadow-card" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {view === "table" && table ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {table.columns.map((c) => (
                  <th
                    key={c.key}
                    scope="col"
                    className={cn(
                      "py-2 pr-4 text-xs font-medium text-muted-foreground last:pr-0",
                      c.align === "right" ? "text-right" : "text-left"
                    )}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  {table.columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn("py-2 pr-4 last:pr-0", c.align === "right" ? "text-right tabular-nums" : "text-left")}
                    >
                      {r[c.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        children
      )}
    </Card>
  );
}
