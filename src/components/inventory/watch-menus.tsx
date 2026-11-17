"use client";

import { Fragment } from "react";
import { Menu } from "@base-ui/react/menu";
import { Check, ChevronDown, MoreHorizontal } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { iconButtonClasses } from "@/components/ui/icon-button";
import { SETTABLE_STATUSES } from "@/lib/validators/watch";
import { cn } from "@/lib/utils";

export type SettableStatus = (typeof SETTABLE_STATUSES)[number];

const positionerClasses = "z-[60] outline-none";
const popupClasses = cn(
  "min-w-40 rounded-lg bg-popover p-1 text-popover-foreground shadow-raised outline-none",
  "origin-[var(--transform-origin)] transition-[opacity,scale] duration-150 ease-out",
  "data-starting-style:scale-[0.98] data-starting-style:opacity-0 data-ending-style:opacity-0"
);
const itemClasses = cn(
  "flex cursor-default select-none items-center gap-2 rounded-md px-2.5 py-1.5 text-sm outline-none",
  "data-highlighted:bg-accent data-disabled:opacity-50"
);

function StageItems({
  current,
  onSelect,
}: {
  current?: string;
  onSelect: (status: SettableStatus) => void;
}) {
  return (
    <Menu.RadioGroup value={current ?? null} onValueChange={(v: SettableStatus) => onSelect(v)}>
      {SETTABLE_STATUSES.map((s) => (
        <Menu.RadioItem key={s} value={s} closeOnClick className={itemClasses}>
          <span className="flex size-4 items-center justify-center">
            <Menu.RadioItemIndicator>
              <Check className="size-3.5" aria-hidden />
            </Menu.RadioItemIndicator>
          </span>
          {s}
        </Menu.RadioItem>
      ))}
    </Menu.RadioGroup>
  );
}

/** Stage badge that opens a menu of the stages you can set. Sold is not settable here. */
export function StageMenu({
  status,
  label,
  onChange,
}: {
  status: string;
  /** Watch name, for the accessible label. */
  label: string;
  onChange: (status: SettableStatus) => void;
}) {
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`Stage of ${label}: ${status}. Change stage`}
        className={cn(
          "group inline-flex items-center gap-0.5 rounded-full",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        )}
      >
        <StatusBadge
          status={status}
          className="transition-colors group-hover:bg-accent group-data-popup-open:bg-accent"
        />
        <ChevronDown
          aria-hidden
          className="size-3.5 text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100"
        />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={4} align="start" className={positionerClasses}>
          <Menu.Popup className={popupClasses}>
            <StageItems current={status} onSelect={(s) => s !== status && onChange(s)} />
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

/** "Set stage" button for the bulk bar. */
export function BulkStageMenu({
  disabled,
  onSelect,
}: {
  disabled?: boolean;
  onSelect: (status: SettableStatus) => void;
}) {
  return (
    <Menu.Root>
      <Menu.Trigger
        disabled={disabled}
        className={buttonClasses({ variant: "secondary", size: "sm" })}
      >
        Set stage
        <ChevronDown aria-hidden />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={4} align="start" className={positionerClasses}>
          <Menu.Popup className={popupClasses}>
            <StageItems onSelect={onSelect} />
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

export interface RowAction {
  label: string;
  onSelect: () => void;
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  destructive?: boolean;
}

/** One "More actions" button per row instead of a strip of icons. */
export function RowActionsMenu({ label, actions }: { label: string; actions: RowAction[] }) {
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`More actions for ${label}`}
        title="More actions"
        className={iconButtonClasses({ className: "data-popup-open:bg-accent data-popup-open:text-foreground" })}
      >
        <MoreHorizontal />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={4} align="end" className={positionerClasses}>
          <Menu.Popup className={popupClasses}>
            {actions.map((a, i) => {
              const Icon = a.icon;
              return (
                <Fragment key={a.label}>
                  {a.destructive && i > 0 && <Menu.Separator className="mx-1 my-1 h-px bg-border" />}
                  <Menu.Item
                    onClick={a.onSelect}
                    className={cn(
                      itemClasses,
                      a.destructive && "text-critical-ink data-highlighted:bg-critical-wash"
                    )}
                  >
                    {Icon && <Icon className="size-4 text-current opacity-70" aria-hidden />}
                    {a.label}
                  </Menu.Item>
                </Fragment>
              );
            })}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
