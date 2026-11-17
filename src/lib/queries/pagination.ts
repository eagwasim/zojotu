export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function paginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResult<T> {
  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export type SortDir = "asc" | "desc";

/**
 * Read ?sort=&dir= and allow only whitelisted keys, so a URL can never pick an
 * arbitrary column. Returns null for "use the default order".
 */
export function parseSort<K extends string>(
  params: URLSearchParams,
  allowed: readonly K[]
): { key: K; dir: SortDir } | null {
  const key = params.get("sort");
  if (!key || !(allowed as readonly string[]).includes(key)) return null;
  return { key: key as K, dir: params.get("dir") === "desc" ? "desc" : "asc" };
}
