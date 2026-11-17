"use client";

import { useEffect, useState } from "react";
import type { ZodError } from "zod";
import type { PlatformFees } from "@/lib/platform-fees";

type SuggestionField = "brand" | "source" | "supplier" | "platform";

// Module-level caches: one request per field per page load, shared by every form.
const suggestionCache = new Map<SuggestionField, Promise<string[]>>();
let feesCache: Promise<PlatformFees> | null = null;

function fetchJson<T>(url: string, fallback: T): Promise<T> {
  return fetch(url)
    .then((r) => (r.ok ? (r.json() as Promise<T>) : fallback))
    .catch(() => fallback);
}

/** Previously used values for a field, most frequent first. */
export function useSuggestions(field: SuggestionField): string[] {
  const [values, setValues] = useState<string[]>([]);
  useEffect(() => {
    let alive = true;
    if (!suggestionCache.has(field)) {
      suggestionCache.set(field, fetchJson<string[]>(`/api/suggestions?field=${field}`, []));
    }
    suggestionCache.get(field)!.then((v) => alive && setValues(v));
    return () => {
      alive = false;
    };
  }, [field]);
  return values;
}

/** Call after saving something that may introduce a new brand/source/supplier/platform. */
export function invalidateSuggestions() {
  suggestionCache.clear();
}

export function usePlatformFees(): PlatformFees {
  const [fees, setFees] = useState<PlatformFees>({});
  useEffect(() => {
    let alive = true;
    feesCache ??= fetchJson<PlatformFees>("/api/platform-fees", {});
    feesCache.then((f) => alive && setFees(f));
    return () => {
      alive = false;
    };
  }, []);
  return fees;
}

export function invalidatePlatformFees() {
  feesCache = null;
}

/** First message per field from a zod error, for showing under each input. */
export function fieldErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

/** Server 400 bodies look like { details: { fieldErrors: { brand: ["…"] } } }. */
export function serverFieldErrors(body: unknown): Record<string, string> {
  const fe = (body as { details?: { fieldErrors?: Record<string, string[]> } })?.details?.fieldErrors;
  if (!fe) return {};
  return Object.fromEntries(
    Object.entries(fe)
      .filter(([, v]) => v?.length)
      .map(([k, v]) => [k, v[0]])
  );
}

/** Copy of an error map with one field cleared (once the user edits that field). */
export function withoutKey(errors: Record<string, string>, key: string): Record<string, string> {
  const next = { ...errors };
  delete next[key];
  return next;
}
