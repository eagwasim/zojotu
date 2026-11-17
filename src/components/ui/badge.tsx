import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "good" | "warning" | "serious" | "critical" | "info";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-secondary text-secondary-foreground",
  good: "bg-good-wash text-good-ink",
  warning: "bg-warning-wash text-warning-ink",
  serious: "bg-serious-wash text-serious-ink",
  critical: "bg-critical-wash text-critical-ink",
  info: "bg-[color-mix(in_oklab,var(--ring)_10%,transparent)] text-link",
};

/** Small label. Status tones carry meaning, so the text itself must say what the state is. */
export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/*
 * Watch lifecycle stage. This is identity, not good/bad, so it uses a neutral pill with a
 * coloured dot (chart slots) rather than status colours. The label always carries the meaning.
 */
const stageDot: Record<string, string> = {
  "In Inventory": "bg-chart-1",
  Modding: "bg-chart-4",
  Listed: "bg-chart-3",
  Sold: "bg-muted-foreground/50",
  "Written off": "bg-critical",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full bg-secondary pl-2 pr-2.5 text-xs font-medium text-secondary-foreground",
        (status === "Sold" || status === "Written off") && "text-muted-foreground",
        className
      )}
    >
      <span
        aria-hidden
        className={cn("size-1.5 rounded-full", stageDot[status] ?? "bg-muted-foreground/50")}
      />
      {status}
    </span>
  );
}
