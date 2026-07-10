"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

interface UsePaginatedFetchOptions {
  url: string;
  pageSize?: number;
}

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
}

export function usePaginatedFetch<T = any>(
  options: UsePaginatedFetchOptions
): UsePaginatedFetchResult<T> {
  const { url, pageSize = 20 } = options;
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const filters: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    if (key !== "page" && key !== "search" && key !== "pageSize") {
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
    for (const [key, value] of Object.entries(filters)) {
      if (value) params.set(key, value);
    }

    try {
      const res = await fetch(`${url}?${params.toString()}`);
      const result = await res.json();
      setData(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch {
      setData([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [url, page, pageSize, search, JSON.stringify(filters)]);

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
  };
}
