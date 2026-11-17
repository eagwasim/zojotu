"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

interface UsePaginatedFetchOptions {
  url: string;
  pageSize?: number;
  /** URL params that are page state, not API filters (e.g. "new" for an open sheet). */
  ignoreParams?: string[];
}

export interface SortParam {
  key: string;
  direction: "asc" | "desc";
}

/** Params the hook manages itself; never forwarded as filters. */
const RESERVED = ["page", "search", "pageSize", "sort", "dir"];

interface UsePaginatedFetchResult<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  filters: Record<string, string>;
  setPage: (page: number) => void;
  setFilter: (key: string, value: string) => void;
  setSearch: (value: string) => void;
  search: string;
  refresh: () => void;
  /** Current sort from the URL (?sort=&dir=), or null for the API default. */
  sort: SortParam | null;
  setSort: (sort: SortParam | null) => void;
  /** Any extra fields the API returns alongside the page (totals, counts…). */
  meta: Record<string, unknown>;
  /** False until the first response arrives; use it to show a skeleton only once. */
  hasLoaded: boolean;
}

export function usePaginatedFetch<T = any>(
  options: UsePaginatedFetchOptions
): UsePaginatedFetchResult<T> {
  const { url, pageSize = 20, ignoreParams = ["new"] } = options;
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [meta, setMeta] = useState<Record<string, unknown>>({});

  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const sortKey = searchParams.get("sort");
  const sortDir = searchParams.get("dir") === "desc" ? "desc" : "asc";
  const sort: SortParam | null = sortKey ? { key: sortKey, direction: sortDir } : null;
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const filters: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    if (!RESERVED.includes(key) && !ignoreParams.includes(key)) {
      filters[key] = value;
    }
  });

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("pageSize", pageSize.toString());
    if (search) params.set("search", search);
    if (sortKey) {
      params.set("sort", sortKey);
      params.set("dir", sortDir);
    }
    for (const [key, value] of Object.entries(filters)) {
      if (value) params.set(key, value);
    }

    try {
      const res = await fetch(`${url}?${params.toString()}`);
      const result = await res.json();
      const { data: rows, total: count, totalPages: pages, ...rest } = result;
      setData(rows ?? []);
      setTotal(count ?? 0);
      setTotalPages(pages ?? 0);
      setMeta(rest);
    } catch {
      setData([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, [url, page, pageSize, search, sortKey, sortDir, JSON.stringify(filters)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const setPage = (newPage: number) => {
    updateParams({ page: newPage.toString() });
  };

  const setFilter = (key: string, value: string) => {
    updateParams({ [key]: value || null, page: "1" });
  };

  const setSearch = (value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams({ search: value || null, page: "1" });
    }, 300);
  };

  const setSort = (next: SortParam | null) => {
    updateParams({ sort: next?.key ?? null, dir: next?.direction ?? null, page: "1" });
  };

  return {
    data,
    total,
    page,
    totalPages,
    loading,
    filters,
    setPage,
    setFilter,
    setSearch,
    search,
    refresh: fetchData,
    sort,
    setSort,
    meta,
    hasLoaded,
  };
}
