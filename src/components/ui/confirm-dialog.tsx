"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { backdropClasses } from "./dialog";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Delete",
  loading = false,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={(next) => !next && !loading && onClose()}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className={backdropClasses} />
        <AlertDialog.Popup
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2",
            "rounded-xl bg-popover p-6 text-popover-foreground shadow-overlay outline-none",
            "transition-[opacity,scale] duration-200 ease-out",
            "data-starting-style:scale-[0.97] data-starting-style:opacity-0",
            "data-ending-style:opacity-0 data-ending-style:duration-150"
          )}
        >
          <AlertDialog.Title className="text-base font-semibold text-foreground">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
            {message}
          </AlertDialog.Description>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onConfirm} disabled={loading}>
              {loading ? "Working…" : confirmLabel}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
