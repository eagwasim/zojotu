"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import { Field, controlClasses, useFieldIds } from "./field";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  /** Show "(optional)" beside the label when the field is not required. */
  markOptional?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, id, markOptional, required, ...props }, ref) => {
    const ids = useFieldIds(id, hint, error);
    return (
      <Field
        label={label}
        hint={hint}
        error={error}
        ids={ids}
        required={markOptional ? !!required : undefined}
      >
        <input
          ref={ref}
          id={ids.id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={ids.describedBy}
          className={cn(controlClasses, "h-9", className)}
          {...props}
        />
      </Field>
    );
  }
);
Input.displayName = "Input";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  markOptional?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, hint, error, id, markOptional, required, rows = 3, ...props }, ref) => {
    const ids = useFieldIds(id, hint, error);
    return (
      <Field
        label={label}
        hint={hint}
        error={error}
        ids={ids}
        required={markOptional ? !!required : undefined}
      >
        <textarea
          ref={ref}
          id={ids.id}
          rows={rows}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={ids.describedBy}
          className={cn(controlClasses, "min-h-[4.5rem] resize-y py-2", className)}
          {...props}
        />
      </Field>
    );
  }
);
Textarea.displayName = "Textarea";
