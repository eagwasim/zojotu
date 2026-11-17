"use client";

/* Recharts passes a loosely typed payload; keep the shape we read explicit. */
interface TooltipRow {
  name?: string | number;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: TooltipRow[];
  /** Format a series value. Receives the row so it can read other fields. */
  formatValue?: (value: number, row: TooltipRow) => string;
  formatLabel?: (label: string) => string;
  /** Extra lines under the series, built from the hovered datum. */
  footer?: (datum: Record<string, unknown>) => React.ReactNode;
}

/** Card-style tooltip: label, then one row per series with a colour swatch. Text stays ink. */
export function ChartTooltip({ active, label, payload, formatValue, formatLabel, footer }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const datum = payload[0]?.payload ?? {};
  return (
    <div className="min-w-40 rounded-lg bg-popover px-3 py-2.5 text-xs text-popover-foreground shadow-raised">
      {label !== undefined && label !== "" && (
        <p className="mb-1.5 font-medium text-foreground">
          {formatLabel ? formatLabel(String(label)) : label}
        </p>
      )}
      <ul className="flex flex-col gap-1">
        {payload.map((row) => (
          <li key={String(row.dataKey ?? row.name)} className="flex items-center gap-2">
            <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: row.color }} />
            <span className="flex-1 text-muted-foreground">{row.name}</span>
            <span className="font-medium tabular-nums text-foreground">
              {formatValue ? formatValue(Number(row.value), row) : String(row.value)}
            </span>
          </li>
        ))}
      </ul>
      {footer && <div className="mt-1.5 border-t border-border pt-1.5 text-muted-foreground">{footer(datum)}</div>}
    </div>
  );
}

/** Legend row: swatch + ink label. Always shown for two or more series. */
export function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span aria-hidden className="size-2 rounded-full" style={{ background: i.color }} />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

export function ChartEmpty({ height, children }: { height: number; children: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-center rounded-lg border border-dashed border-input/80 px-6 text-center text-sm text-muted-foreground"
      style={{ height }}
    >
      {children}
    </div>
  );
}
