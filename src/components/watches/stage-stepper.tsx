"use client";

import { Check } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

const STAGES = [
  { status: "In Inventory", label: "In Inventory" },
  { status: "Modding", label: "Modding" },
  { status: "Listed", label: "Listed" },
  { status: "Sold", label: "Sold" },
] as const;

interface StageStepperProps {
  status: string;
  acquisitionDate: string;
  listedDate?: string | null;
  soldDate?: string | null;
  /** Called with the stage clicked. Sold is never set directly; the page opens the sale sheet. */
  onSelect?: (status: string) => void;
  disabled?: boolean;
}

/** The watch's lifecycle as a row of steps. Each step is a button that moves it there. */
export function StageStepper({
  status,
  acquisitionDate,
  listedDate,
  soldDate,
  onSelect,
  disabled,
}: StageStepperProps) {
  const current = Math.max(0, STAGES.findIndex((s) => s.status === status));
  const sold = status === "Sold";
  const dates: Record<string, string | null | undefined> = {
    "In Inventory": acquisitionDate,
    Listed: listedDate,
    Sold: soldDate,
  };

  return (
    <ol aria-label="Stage" className="grid grid-cols-4 gap-1.5">
      {STAGES.map((stage, i) => {
        const done = i < current;
        const active = i === current;
        // Once sold, the stage is owned by the sale record.
        const clickable = !!onSelect && !disabled && !active && !sold;
        const date = dates[stage.status];
        return (
          <li key={stage.status} className="min-w-0">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => onSelect?.(stage.status)}
              aria-current={active ? "step" : undefined}
              title={clickable ? (stage.status === "Sold" ? "Record the sale" : `Move to ${stage.label}`) : undefined}
              className={cn(
                "group flex w-full flex-col gap-2 rounded-lg p-2 text-left transition-colors duration-150",
                clickable && "hover:bg-accent/70",
                !clickable && "cursor-default"
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "h-1 w-full rounded-full",
                  active || done ? "bg-foreground" : "bg-border",
                  clickable && !done && "group-hover:bg-foreground/30"
                )}
              />
              <span className="flex items-center gap-1.5">
                {done && <Check className="size-3.5 text-muted-foreground" aria-hidden />}
                <span
                  className={cn(
                    "truncate text-sm",
                    active ? "font-semibold text-foreground" : done ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {stage.label}
                </span>
                {done && <span className="sr-only">(done)</span>}
              </span>
              <span className="h-4 truncate text-xs tabular-nums text-muted-foreground">
                {date && (done || active) ? formatDate(date) : ""}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
