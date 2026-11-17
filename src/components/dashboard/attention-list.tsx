"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, AlertTriangle, ChevronRight, CheckCircle2, Info } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ActionItem } from "@/lib/dashboard/compute";

const severity = {
  serious: { icon: AlertCircle, className: "text-serious-ink", label: "Urgent" },
  warning: { icon: AlertTriangle, className: "text-warning-ink", label: "Needs attention" },
  info: { icon: Info, className: "text-link", label: "Suggestion" },
} as const;

const VISIBLE = 6;

/** "What needs attention?": the next things to do, most urgent first. Each links to where you fix it. */
export function AttentionList({ items, className }: { items: ActionItem[]; className?: string }) {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? items : items.slice(0, VISIBLE);

  return (
    <Card className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-col gap-1">
        <CardTitle>Needs attention</CardTitle>
        <CardDescription>
          {items.length === 0 ? "Nothing right now." : `${items.length} thing${items.length === 1 ? "" : "s"} to look at.`}
        </CardDescription>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center text-sm text-muted-foreground">
          <CheckCircle2 className="size-6 text-good-ink" aria-hidden />
          Stock is moving and no service jobs are waiting.
        </div>
      ) : (
        <ul className="-mx-2 flex flex-col">
          {shown.map((a) => {
            const s = severity[a.severity];
            return (
              <li key={a.id}>
                <Link
                  href={a.href}
                  className="flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors duration-150 hover:bg-accent/60"
                >
                  <s.icon className={cn("mt-0.5 size-4 shrink-0", s.className)} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="sr-only">{s.label}: </span>
                    <span className="block text-sm font-medium text-foreground">{a.title}</span>
                    <span className="block text-xs text-muted-foreground">{a.detail}</span>
                  </span>
                  <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {items.length > VISIBLE && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="w-fit text-xs font-medium text-link hover:underline"
        >
          {showAll ? "Show fewer" : `Show all ${items.length}`}
        </button>
      )}
    </Card>
  );
}
