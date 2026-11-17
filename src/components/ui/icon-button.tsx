import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: icon-only controls must be named for screen readers. */
  "aria-label": string;
  tone?: "default" | "destructive";
  size?: "sm" | "md";
}

export function iconButtonClasses({
  tone = "default",
  size = "md",
  className,
}: { tone?: "default" | "destructive"; size?: "sm" | "md"; className?: string } = {}) {
  return cn(
    "relative inline-flex shrink-0 items-center justify-center rounded-md text-muted-foreground",
    "after:absolute after:-inset-1 after:content-['']",
    "transition-[background-color,color,scale] duration-150 ease-out active:scale-[0.96]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "disabled:pointer-events-none disabled:opacity-40",
    "[&_svg]:size-4",
    size === "md" ? "size-8" : "size-7",
    tone === "default"
      ? "hover:bg-accent hover:text-foreground"
      : "hover:bg-critical-wash hover:text-critical-ink",
    className
  );
}

/**
 * Square icon-only button. Use `iconButtonClasses()` on a `Link` for icon-only navigation. The visible box is 32px (sm 28px); a pseudo-element
 * extends the hit area to 40px without changing layout.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, tone = "default", size = "md", type = "button", title, ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      title={title ?? props["aria-label"]}
      className={iconButtonClasses({ tone, size, className })}
      {...props}
    />
  )
);
IconButton.displayName = "IconButton";
