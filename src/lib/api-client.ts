export class ApiError extends Error {
  status: number;
  /** Parsed error body, e.g. { error, details: { fieldErrors } } from a 400. */
  body: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function apiRequest<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, options);

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      data.error || `Request failed (${res.status})`;
    throw new ApiError(message, res.status, data);
  }

  return res.json();
}

export function apiPost<T = any>(url: string, body: any): Promise<T> {
  return apiRequest<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function apiPut<T = any>(url: string, body: any): Promise<T> {
  return apiRequest<T>(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function apiDelete(url: string): Promise<any> {
  return apiRequest(url, { method: "DELETE" });
}
