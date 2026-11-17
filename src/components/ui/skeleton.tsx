import { cn } from "@/lib/utils";

/** Placeholder block shaped like the content it stands in for. */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-md bg-foreground/[0.06]", className)}
      {...props}
    />
  );
}

/** A table-shaped skeleton: header bar plus `rows` rows of `cols` cells. */
export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div role="status" aria-label="Loading" className="overflow-hidden rounded-xl bg-card shadow-card">
      <div className="flex gap-6 border-b border-border px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-6 border-b border-border px-4 py-4 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={cn("h-3.5 flex-1", c === 0 && "flex-[1.6]")} />
          ))}
        </div>
      ))}
    </div>
  );
}
