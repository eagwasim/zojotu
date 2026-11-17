import Link from "next/link";
import { Watch } from "lucide-react";
import { cn } from "@/lib/utils";

/** The wordmark: watch glyph plus the name in the display face, same as the admin header. */
export function BrandMark({
  href = "/",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "-mx-2 inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-foreground",
        className
      )}
    >
      <Watch aria-hidden className="size-5" strokeWidth={1.75} />
      <span className="font-display text-xl font-medium tracking-tight">Zojotu</span>
    </Link>
  );
}

/** One content width for every public page, so left and right edges line up down the page. */
export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8", className)}>{children}</div>;
}

/** Text link whose underline draws in on hover. */
export const drawnUnderline =
  "bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-[position:0_100%] bg-no-repeat transition-[background-size] duration-200 ease-out hover:bg-[length:100%_1px] focus-visible:bg-[length:100%_1px]";
