"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "./icon-button";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

function pageNumbers(page: number, totalPages: number) {
  const pages: (number | "ellipsis")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }
  pages.push(1);
  if (page > 3) pages.push("ellipsis");
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
  if (page < totalPages - 2) pages.push("ellipsis");
  pages.push(totalPages);
  return pages;
}

export function Pagination({ page, totalPages, total, pageSize, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4">
      <p className="text-sm tabular-nums text-muted-foreground">
        {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-2">
        <IconButton aria-label="Previous page" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          <ChevronLeft />
        </IconButton>
        {pageNumbers(page, totalPages).map((p, idx) =>
          p === "ellipsis" ? (
            <span key={`e-${idx}`} aria-hidden className="w-6 text-center text-sm text-muted-foreground">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              aria-label={`Page ${p}`}
              aria-current={p === page ? "page" : undefined}
              onClick={() => onPageChange(p)}
              className={cn(
                "relative h-8 min-w-8 rounded-md px-2 text-sm tabular-nums transition-[background-color,color] duration-150",
                "after:absolute after:-inset-1 after:content-['']",
                p === page
                  ? "bg-primary font-medium text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {p}
            </button>
          )
        )}
        <IconButton
          aria-label="Next page"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight />
        </IconButton>
      </div>
    </nav>
  );
}
