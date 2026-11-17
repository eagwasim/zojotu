"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/** Shared classes for every text-like control so inputs, selects and textareas match. */
export const controlClasses = cn(
  "block w-full rounded-md border border-input bg-card px-3 text-sm text-foreground",
  "placeholder:text-placeholder",
  "transition-[border-color,box-shadow] duration-150 ease-out",
  "hover:border-foreground/30",
  "focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/15",
  "disabled:cursor-not-allowed disabled:opacity-60",
  "aria-invalid:border-critical aria-invalid:focus-visible:ring-critical/15"
);

interface FieldIds {
  id: string;
  hintId?: string;
  errorId?: string;
  describedBy?: string;
}

export function useFieldIds(id: string | undefined, hint?: string, error?: string): FieldIds {
  const generated = useId();
  const fieldId = id ?? generated;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;
  return { id: fieldId, hintId, errorId, describedBy };
}

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  ids: FieldIds;
  className?: string;
  children: React.ReactNode;
}

/** Label + control + hint/error, wired with htmlFor and aria-describedby. */
export function Field({ label, hint, error, required, ids, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={ids.id} className="text-sm font-medium text-foreground">
          {label}
          {required === false && (
            <span className="ml-1 font-normal text-muted-foreground">(optional)</span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p id={ids.errorId} className="text-xs text-critical-ink">
          {error}
        </p>
      ) : hint ? (
        <p id={ids.hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
