"use client";

import Link from "next/link";
import { StatTile } from "@/components/ui/stat-tile";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { Dashboard } from "@/lib/dashboard/compute";
import { relChange } from "./hero-stats";

/** The workshop: completed-job money for the period, plus the live queue. */
export function ServicePanel({ data, comparison }: { data: Dashboard; comparison?: string }) {
  const { current: c, previous: p, pending, active, unpaid } = data.service;
  const noBase = p ? "Nothing to compare with last period" : undefined;
  const turnDelta =
    p && c.avgTurnaroundDays !== null && p.avgTurnaroundDays !== null
      ? relChange(c.avgTurnaroundDays, p.avgTurnaroundDays)
      : null;

  const queue = [
    { label: "Waiting for a reply", value: pending, href: "/services?status=Pending" },
    { label: "In progress", value: active, href: "/services" },
    { label: "Finished, not paid", value: unpaid.count, href: "/services", extra: unpaid.count ? formatCurrency(unpaid.amount) : null },
  ];

  return (
    <div className="flex flex-col gap-4">
      <section aria-label="Service numbers" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Service revenue"
          value={formatCurrency(c.revenue)}
          delta={relChange(c.revenue, p?.revenue)}
          deltaFallback={noBase}
          comparisonLabel={comparison}
          definition="Final price of service jobs completed in the period."
        />
        <StatTile
          label="Service profit"
          value={formatCurrency(c.profit)}
          delta={relChange(c.profit, p?.profit)}
          deltaFallback={noBase}
          comparisonLabel={comparison}
          definition="Service revenue minus the parts used on those jobs."
        />
        <StatTile
          label="Jobs completed"
          value={String(c.completed)}
          delta={relChange(c.completed, p?.completed)}
          deltaFallback={noBase}
          comparisonLabel={comparison}
        />
        <StatTile
          label="Avg turnaround"
          value={c.avgTurnaroundDays === null ? "—" : `${Math.round(c.avgTurnaroundDays)} days`}
          delta={turnDelta}
          increaseIs="bad"
          comparisonLabel={comparison}
          definition="Days from receiving a watch to completing the job."
        />
      </section>

      <Card className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <CardTitle>Workshop queue</CardTitle>
          <CardDescription>Right now, regardless of the period above.</CardDescription>
        </div>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {queue.map((q) => (
            <Link
              key={q.label}
              href={q.href}
              className="flex flex-col gap-1 rounded-lg bg-secondary/60 p-4 transition-colors duration-150 hover:bg-accent"
            >
              <dt className="text-xs text-muted-foreground">{q.label}</dt>
              <dd className="text-2xl font-semibold tabular-nums text-foreground">
                {q.value}
                {q.extra && <span className="ml-2 text-sm font-normal text-muted-foreground">{q.extra}</span>}
              </dd>
            </Link>
          ))}
        </dl>
      </Card>
    </div>
  );
}
