import { ArrowDownRight, ArrowUpRight, Info, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: string;
  /** Change vs comparison period, as a fraction (0.12 = +12%), or points if `deltaUnit="points"`. */
  delta?: number | null;
  /** "relative" (default): ±12.0%. "points": for rates such as margin, ±3.1 pts. */
  deltaUnit?: "relative" | "points";
  /** Shown instead of a delta when there is nothing to compare against, e.g. "No sales last period". */
  deltaFallback?: string;
  /** Whether an increase is good (revenue) or bad (days to sell, expenses). */
  increaseIs?: "good" | "bad";
  /** e.g. "vs previous 30 days" */
  comparisonLabel?: string;
  /** Plain-language definition, shown on hover/focus of the info icon. */
  definition?: string;
  /** Trend values, oldest first. Rendered as a single-series sparkline. */
  trend?: number[];
  className?: string;
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const w = 96;
  const h = 28;
  const pad = 3;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [
    pad + (i / (values.length - 1)) * (w - pad * 2),
    h - pad - ((v - min) / span) * (h - pad * 2),
  ]);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden className="shrink-0 overflow-visible">
      <path d={d} fill="none" stroke="var(--chart-1)" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r={2.5} fill="var(--chart-1)" stroke="var(--card)" strokeWidth={1.5} />
    </svg>
  );
}

/** A headline number with optional comparison and trend. The number is the chart. */
export function StatTile({
  label,
  value,
  delta,
  deltaUnit = "relative",
  deltaFallback,
  increaseIs = "good",
  comparisonLabel,
  definition,
  trend,
  className,
}: StatTileProps) {
  const hasDelta = delta !== undefined && delta !== null && Number.isFinite(delta);
  const flat = hasDelta && Math.abs(delta!) < 0.005;
  const up = hasDelta && delta! > 0;
  const good = flat ? null : up === (increaseIs === "good");
  const DeltaIcon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;

  return (
    <div className={cn("flex flex-col gap-3 rounded-xl bg-card p-5 shadow-card", className)}>
      <div className="flex items-center gap-1.5">
        <p className="text-sm text-muted-foreground">{label}</p>
        {definition && (
          <span className="group relative inline-flex">
            <button
              type="button"
              aria-label={`What is ${label}?`}
              className="relative rounded-full text-muted-foreground/70 after:absolute after:-inset-2 after:content-[''] hover:text-foreground"
            >
              <Info className="size-3.5" />
            </button>
            <span
              role="tooltip"
              className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-60 -translate-x-1/2 rounded-lg bg-foreground px-3 py-2 text-xs leading-relaxed text-background opacity-0 shadow-overlay transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100"
            >
              {definition}
            </span>
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-3">
        <p className="text-[1.75rem] font-semibold leading-none tracking-tight text-foreground">
          {value}
        </p>
        {trend && <Sparkline values={trend} />}
      </div>
      {!hasDelta && deltaFallback && <p className="text-xs text-muted-foreground">{deltaFallback}</p>}
      {hasDelta && (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium tabular-nums",
              good === true && "text-good-ink",
              good === false && "text-critical-ink",
              good === null && "text-muted-foreground"
            )}
          >
            <DeltaIcon className="size-3.5" aria-hidden />
            {flat
              ? deltaUnit === "points" ? "0 pts" : "0%"
              : `${up ? "+" : "−"}${Math.abs(delta! * 100).toFixed(1)}${deltaUnit === "points" ? " pts" : "%"}`}
          </span>
          {comparisonLabel && <span>{comparisonLabel}</span>}
        </p>
      )}
    </div>
  );
}
