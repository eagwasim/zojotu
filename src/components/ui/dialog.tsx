"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "./icon-button";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const backdropClasses =
  "fixed inset-0 z-50 min-h-dvh bg-[#1a1917]/30 transition-opacity duration-150 ease-out data-ending-style:opacity-0 data-starting-style:opacity-0 supports-[-webkit-touch-callout:none]:absolute";

/**
 * Centered modal. Focus is trapped, Escape and backdrop click close it,
 * and focus returns to the trigger on close (Base UI).
 */
export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  return (
    <BaseDialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className={backdropClasses} />
        <BaseDialog.Popup
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col",
            "rounded-xl bg-popover text-popover-foreground shadow-overlay outline-none",
            "transition-[opacity,scale,translate] duration-200 ease-out",
            "data-starting-style:scale-[0.97] data-starting-style:opacity-0",
            "data-ending-style:translate-y-[calc(-50%+6px)] data-ending-style:opacity-0 data-ending-style:duration-150",
            className
          )}
        >
          <div className="flex items-start justify-between gap-4 px-6 pt-5">
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
            <BaseDialog.Close render={<IconButton aria-label="Close" className="-mr-2 -mt-1" />}>
              <X />
            </BaseDialog.Close>
          </div>
          <div className="overflow-y-auto px-6 pb-6 pt-4">{children}</div>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
