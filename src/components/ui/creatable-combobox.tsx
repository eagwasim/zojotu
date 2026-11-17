"use client";

import { Autocomplete } from "@base-ui/react/autocomplete";
import { Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Field, controlClasses, useFieldIds } from "./field";

interface CreatableComboboxProps {
  name?: string;
  label?: string;
  hint?: string;
  error?: string;
  id?: string;
  required?: boolean;
  markOptional?: boolean;
  placeholder?: string;
  /** Previously used values, e.g. distinct sources or suppliers. */
  suggestions: string[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

/**
 * Free-text field with suggestions from values used before. Typing something new
 * is allowed (it is just text), so new suppliers or platforms need no extra step.
 * Matching is case-insensitive, so "ebay" suggests "eBay" and keeps spellings consistent.
 */
export function CreatableCombobox({
  name,
  label,
  hint,
  error,
  id,
  required,
  markOptional,
  placeholder,
  suggestions,
  defaultValue,
  value,
  onValueChange,
  className,
}: CreatableComboboxProps) {
  const ids = useFieldIds(id, hint, error);
  const controlled = value !== undefined;
  const [inner, setInner] = useState(defaultValue ?? "");
  const current = controlled ? value : inner;

  const unique = Array.from(new Set(suggestions.filter(Boolean)));
  const trimmed = current.trim();
  const exact = unique.some((s) => s.toLowerCase() === trimmed.toLowerCase());

  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      ids={ids}
      required={markOptional ? !!required : undefined}
    >
      <Autocomplete.Root
        items={unique}
        name={name}
        required={required}
        value={current}
        onValueChange={(next) => {
          if (!controlled) setInner(next);
          onValueChange?.(next);
        }}
        openOnInputClick
      >
        <Autocomplete.Input
          id={ids.id}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={ids.describedBy}
          className={cn(controlClasses, "h-9", className)}
        />
        <Autocomplete.Portal>
          <Autocomplete.Positioner sideOffset={4} className="z-[60] outline-none">
            <Autocomplete.Popup
              className={cn(
                "w-[var(--anchor-width)] max-w-[var(--available-width)] overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-raised",
                "origin-[var(--transform-origin)] transition-[opacity,scale] duration-150 ease-out",
                "data-starting-style:scale-[0.98] data-starting-style:opacity-0 data-ending-style:opacity-0"
              )}
            >
              <Autocomplete.List className="max-h-[min(16rem,var(--available-height))] overflow-y-auto overscroll-contain p-1 outline-none data-empty:p-0">
                {(item: string) => (
                  <Autocomplete.Item
                    key={item}
                    value={item}
                    className="flex cursor-default select-none items-center rounded-md px-2.5 py-1.5 text-sm outline-none data-highlighted:bg-accent"
                  >
                    {item}
                  </Autocomplete.Item>
                )}
              </Autocomplete.List>
              {trimmed && !exact && (
                <div className="flex items-center gap-2 border-t border-border px-3 py-2 text-xs text-muted-foreground">
                  <Plus className="size-3.5" aria-hidden />
                  <span>
                    New: <span className="font-medium text-foreground">{trimmed}</span>
                  </span>
                </div>
              )}
            </Autocomplete.Popup>
          </Autocomplete.Positioner>
        </Autocomplete.Portal>
      </Autocomplete.Root>
    </Field>
  );
}
