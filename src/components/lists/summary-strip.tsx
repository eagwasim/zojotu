import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export interface SummaryItem {
  label: string;
  /** Formatted value; omit (undefined) while loading. */
  value?: string;
  /** Small secondary line, e.g. "38% of spend". */
  hint?: string;
  tone?: "default" | "critical";
}

interface SummaryStripProps {
  items: SummaryItem[];
  /** True when a search or filter narrows the list; labels the totals accordingly. */
  filtered?: boolean;
  /** Dim while a refetch is in flight. */
  stale?: boolean;
  className?: string;
}

/**
 * Compact totals above a list: one card, 2–4 figures, in the StatTile style but lighter so
 * the table stays the focus. Totals cover the whole filtered set, not just the page.
 */
export function SummaryStrip({ items, filtered, stale, className }: SummaryStripProps) {
  return (
    <section aria-label={filtered ? "Totals for these filters" : "Totals"} className={cn("space-y-1.5", className)}>
      <p className="text-xs text-muted-foreground">{filtered ? "Totals for these filters" : "All time"}</p>
      <dl
        className={cn(
          "grid grid-cols-2 overflow-hidden rounded-xl bg-card shadow-card transition-opacity duration-150",
          items.length >= 4 ? "sm:grid-cols-4" : items.length === 3 ? "sm:grid-cols-3" : "",
          stale && "opacity-60"
        )}
      >
        {items.map((item, i) => (
          <div
            key={item.label}
            className={cn(
              "flex min-w-0 flex-col gap-1 border-border px-4 py-3",
              // Hairlines between cells: left edge except the first in each row, top edge on the second row.
              i % 2 === 1 && "border-l",
              i >= 2 && "border-t",
              items.length >= 3 && "sm:border-t-0",
              items.length >= 3 && i > 0 && "sm:border-l",
              items.length === 3 && i === 2 && "col-span-2 sm:col-span-1"
            )}
          >
            <dt className="truncate text-xs text-muted-foreground">{item.label}</dt>
            <dd
              className={cn(
                "truncate text-lg font-semibold leading-tight tracking-tight tabular-nums",
                item.tone === "critical" ? "text-critical-ink" : "text-foreground"
              )}
            >
              {item.value ?? <Skeleton className="h-6 w-20" />}
            </dd>
            {item.hint && <dd className="truncate text-xs text-muted-foreground">{item.hint}</dd>}
          </div>
        ))}
      </dl>
    </section>
  );
}
