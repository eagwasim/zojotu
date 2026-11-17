"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Params kept when clearing filters: the sort is a view choice, not a filter. */
const KEEP = ["sort", "dir", "pageSize"];

/**
 * Clears search and every filter in one URL update. (Calling the paginated hook's
 * setFilter and setSearch back to back would race: setSearch is debounced and would
 * restore the filter from its stale params.)
 */
export function useClearFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return () => {
    const next = new URLSearchParams();
    for (const key of KEEP) {
      const v = searchParams.get(key);
      if (v) next.set(key, v);
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
}
