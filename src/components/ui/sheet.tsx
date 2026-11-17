"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "./icon-button";
import { backdropClasses } from "./dialog";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  side?: "right" | "left";
  children: React.ReactNode;
  /** Sticky footer, e.g. form actions. */
  footer?: React.ReactNode;
  className?: string;
}

/** Side drawer for longer forms and detail views. Same focus/escape behaviour as Dialog. */
export function Sheet({
  open,
  onClose,
  title,
  description,
  side = "right",
  children,
  footer,
  className,
}: SheetProps) {
  return (
    <BaseDialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className={backdropClasses} />
        <BaseDialog.Popup
          className={cn(
            "fixed inset-y-0 z-50 flex w-full max-w-md flex-col bg-popover text-popover-foreground shadow-overlay outline-none",
            "transition-[translate,opacity] duration-250 ease-[cubic-bezier(0.2,0,0,1)]",
            side === "right"
              ? "right-0 data-ending-style:translate-x-8 data-starting-style:translate-x-full"
              : "left-0 data-ending-style:-translate-x-8 data-starting-style:-translate-x-full",
            "data-ending-style:opacity-0 data-ending-style:duration-150",
            className
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
            <div className="flex flex-col gap-1">
              <BaseDialog.Title className="text-base font-semibold text-foreground">
                {title}
              </BaseDialog.Title>
              {description && (
                <BaseDialog.Description className="text-sm text-muted-foreground">
                  {description}
                </BaseDialog.Description>
              )}
            </div>
            <BaseDialog.Close render={<IconButton aria-label="Close" className="-mr-2" />}>
              <X />
            </BaseDialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
          {footer && (
            <div className="flex justify-end gap-3 border-t border-border px-6 py-4">{footer}</div>
          )}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
