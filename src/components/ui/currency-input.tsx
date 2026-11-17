"use client";

import { forwardRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Field, controlClasses, useFieldIds } from "./field";

interface CurrencyInputProps {
  name?: string;
  label?: string;
  hint?: string;
  error?: string;
  id?: string;
  required?: boolean;
  markOptional?: boolean;
  disabled?: boolean;
  placeholder?: string;
  /** Uncontrolled initial value. */
  defaultValue?: number | string | null;
  /** Controlled value (number, or null when empty). */
  value?: number | null;
  onValueChange?: (value: number | null) => void;
  symbol?: string;
  className?: string;
  autoFocus?: boolean;
}

const display = new Intl.NumberFormat("en-IE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function parse(text: string): number | null {
  const cleaned = text.replace(/[^0-9.,-]/g, "").replace(/,/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function toNumber(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parse(v);
  return n;
}

/**
 * Money input: right-aligned, tabular, formatted on blur ("1,250.00").
 * When `name` is set, a hidden input submits the raw number ("1250") so
 * existing `FormData` + `parseFloat` handlers keep working.
 */
export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      name,
      label,
      hint,
      error,
      id,
      required,
      markOptional,
      disabled,
      placeholder = "0.00",
      defaultValue,
      value,
      onValueChange,
      symbol = "€",
      className,
      autoFocus,
    },
    ref
  ) => {
    const ids = useFieldIds(id, hint, error);
    const controlled = value !== undefined;
    const [inner, setInner] = useState<number | null>(() => toNumber(defaultValue));
    const current = controlled ? value : inner;
    const [text, setText] = useState(() => (current === null ? "" : display.format(current)));
    const [focused, setFocused] = useState(false);

    // Keep the visible text in step with a controlled value changed from outside.
    const shown = focused ? text : current === null ? "" : display.format(current);

    const commit = (next: number | null) => {
      if (!controlled) setInner(next);
      onValueChange?.(next);
    };

    return (
      <Field
        label={label}
        hint={hint}
        error={error}
        ids={ids}
        required={markOptional ? !!required : undefined}
      >
        <div className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
          >
            {symbol}
          </span>
          <input
            ref={ref}
            id={ids.id}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            autoFocus={autoFocus}
            disabled={disabled}
            required={required}
            placeholder={placeholder}
            aria-invalid={error ? true : undefined}
            aria-describedby={ids.describedBy}
            value={shown}
            onFocus={(e) => {
              setFocused(true);
              setText(current === null ? "" : String(current));
              requestAnimationFrame(() => e.target.select());
            }}
            onChange={(e) => {
              setText(e.target.value);
              commit(parse(e.target.value));
            }}
            onBlur={() => setFocused(false)}
            className={cn(controlClasses, "h-9 pl-7 text-right tabular-nums", className)}
          />
          {name && <input type="hidden" name={name} value={current === null ? "" : String(current)} />}
        </div>
      </Field>
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";
