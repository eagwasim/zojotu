"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Field, controlClasses, useFieldIds } from "./field";

/** Local date as YYYY-MM-DD (not UTC, so "today" is right late in the evening). */
export function isoDate(d: Date = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface DateInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "defaultValue" | "value" | "onChange"> {
  label?: string;
  hint?: string;
  error?: string;
  markOptional?: boolean;
  /** Defaults to today. Pass `null` for an empty field. */
  defaultValue?: string | null;
  value?: string;
  onValueChange?: (value: string) => void;
  /** Show Today / Yesterday shortcuts under the field. */
  quickPicks?: boolean;
}

/** Native date input that defaults to today, with optional quick picks. */
export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      label,
      hint,
      error,
      id,
      markOptional,
      required,
      defaultValue,
      value,
      onValueChange,
      quickPicks = true,
      className,
      ...props
    },
    ref
  ) => {
    const ids = useFieldIds(id, hint, error);
    const inputRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const controlled = value !== undefined;
    const [inner, setInner] = useState(defaultValue === null ? "" : (defaultValue ?? isoDate()));
    const current = controlled ? value : inner;

    const set = (next: string) => {
      if (!controlled) setInner(next);
      onValueChange?.(next);
    };

    const today = isoDate();
    const yesterday = isoDate(new Date(Date.now() - 86_400_000));

    return (
      <Field
        label={label}
        hint={hint}
        error={error}
        ids={ids}
        required={markOptional ? !!required : undefined}
      >
        <input
          ref={inputRef}
          id={ids.id}
          type="date"
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={ids.describedBy}
          value={current}
          onChange={(e) => set(e.target.value)}
          className={cn(controlClasses, "h-9 tabular-nums", className)}
          {...props}
        />
        {quickPicks && (
          <div className="flex gap-1.5">
            {[
              { label: "Today", v: today },
              { label: "Yesterday", v: yesterday },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => set(p.v)}
                aria-pressed={current === p.v}
                className={cn(
                  "rounded px-1.5 py-0.5 text-xs transition-colors duration-150",
                  current === p.v
                    ? "bg-secondary font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </Field>
    );
  }
);
DateInput.displayName = "DateInput";
