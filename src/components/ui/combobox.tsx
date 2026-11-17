"use client";

import { useState, useRef, useEffect, useCallback, useId } from "react";
import { cn } from "@/lib/utils";
import { Search, X, Loader2 } from "lucide-react";

interface ComboboxItem {
  id: number;
  brand: string;
  model: string;
  [key: string]: any;
}

interface ComboboxProps {
  label?: string;
  name: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  fetchUrl: string;
  fetchParams?: Record<string, string>;
  placeholder?: string;
  error?: string;
}

export function Combobox({
  label,
  name,
  value: controlledValue,
  defaultValue,
  onChange,
  fetchUrl,
  fetchParams = {},
  placeholder = "Search...",
  error,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ComboboxItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState("");
  const [internalValue, setInternalValue] = useState(defaultValue || "");
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputId = useId();
  const errorId = `${inputId}-error`;

  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (defaultValue && !selectedLabel) {
      const params = new URLSearchParams({ ...fetchParams });
      fetch(`${fetchUrl}?${params}`)
        .then((r) => r.json())
        .then((items: ComboboxItem[]) => {
          const match = items.find((i) => i.id.toString() === defaultValue);
          if (match) setSelectedLabel(`${match.brand} ${match.model}`);
        })
        .catch(() => {});
    }
  }, [defaultValue]);

  const fetchResults = useCallback(
    (q: string) => {
      setLoading(true);
      const params = new URLSearchParams({ q, ...fetchParams });
      fetch(`${fetchUrl}?${params}`)
        .then((r) => r.json())
        .then((items: ComboboxItem[]) => {
          setResults(items);
          setHighlightIndex(-1);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    },
    [fetchUrl, fetchParams]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    setOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(q), 300);
  };

  const handleSelect = (item: ComboboxItem) => {
    const val = item.id.toString();
    const label = `${item.brand} ${item.model}`;
    setInternalValue(val);
    setSelectedLabel(label);
    setQuery("");
    setOpen(false);
    onChange?.(val);
  };

  const handleClear = () => {
    setInternalValue("");
    setSelectedLabel("");
    setQuery("");
    setResults([]);
    onChange?.("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown") {
        setOpen(true);
        fetchResults(query);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, results.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightIndex >= 0 && results[highlightIndex]) {
          handleSelect(results[highlightIndex]);
        }
        break;
      case "Escape":
        setOpen(false);
        break;
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-1.5" ref={containerRef}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <input type="hidden" name={name} value={value} />
        <div
          className={cn(
            "flex h-9 items-center rounded-md border border-input bg-card text-sm transition-[border-color,box-shadow] duration-150",
            error && "border-critical",
            open && "border-ring ring-3 ring-ring/15"
          )}
        >
          <Search className="ml-2.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            id={inputId}
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            ref={inputRef}
            type="text"
            className="w-full bg-transparent px-2 py-2 text-sm text-foreground placeholder:text-placeholder focus:outline-none"
            placeholder={selectedLabel || placeholder}
            value={selectedLabel && !open ? "" : query}
            onChange={handleInputChange}
            onFocus={() => {
              setOpen(true);
              if (!results.length) fetchResults(query);
            }}
            onKeyDown={handleKeyDown}
          />
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-muted-foreground" />}
          {selectedLabel && !loading && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear selected watch"
              className="mr-2 rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {selectedLabel && !open && (
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {selectedLabel}
          </p>
        )}

        {open && (
          <div className="absolute z-[60] mt-1 w-full overflow-hidden rounded-lg bg-popover p-1 shadow-raised">
            <div className="max-h-[200px] overflow-y-auto">
              {results.length === 0 && !loading && (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  {query ? "No results found" : "Type to search..."}
                </div>
              )}
              {results.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  className={cn(
                    "flex w-full items-center px-3 py-2 text-left text-sm transition-colors",
                    idx === highlightIndex
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-accent/50"
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setHighlightIndex(idx)}
                >
                  <span className="font-medium">{item.brand}</span>
                  <span className="ml-1.5 text-muted-foreground">{item.model}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {error && <p id={errorId} className="text-xs text-critical-ink">{error}</p>}
    </div>
  );
}
