"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { Field, controlClasses, useFieldIds } from "./field";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: { value: string; label: string }[];
  /** Text for the empty option. Pass `false` to omit it. */
  placeholder?: string | false;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, hint, error, id, options, placeholder = "Select…", ...props }, ref) => {
    const ids = useFieldIds(id, hint, error);
    return (
      <Field label={label} hint={hint} error={error} ids={ids}>
        <div className="relative">
          <select
            ref={ref}
            id={ids.id}
            aria-invalid={error ? true : undefined}
            aria-describedby={ids.describedBy}
            className={cn(controlClasses, "h-9 appearance-none pr-9", className)}
            {...props}
          >
            {placeholder !== false && <option value="">{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
        </div>
      </Field>
    );
  }
);
Select.displayName = "Select";
