import { cn } from "@/lib/utils";
import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Disable the press-scale feedback (e.g. inside dense toolbars). */
  static?: boolean;
}

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/88",
  secondary:
    "bg-card text-foreground shadow-card hover:bg-accent",
  ghost: "text-foreground hover:bg-accent",
  destructive:
    "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
};

const sizes: Record<Size, string> = {
  sm: "h-8 gap-1.5 px-3 text-xs",
  md: "h-9 gap-2 px-4 text-sm",
  lg: "h-10 gap-2 px-5 text-sm",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  isStatic = false,
  className,
}: {
  variant?: Variant;
  size?: Size;
  isStatic?: boolean;
  className?: string;
} = {}) {
  return cn(
    "inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-md font-medium",
    "transition-[background-color,color,box-shadow,scale] duration-150 ease-out",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:size-4 [&_svg]:shrink-0",
    !isStatic && "active:scale-[0.96]",
    variants[variant],
    sizes[size],
    className
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", static: isStatic, ...props },
    ref
  ) => (
    <button
      ref={ref}
      className={buttonClasses({ variant, size, isStatic, className })}
      {...props}
    />
  )
);
Button.displayName = "Button";
