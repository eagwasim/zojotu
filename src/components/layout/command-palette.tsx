"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CornerDownLeft, Loader2, Search, Watch } from "lucide-react";
import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";
import { backdropClasses } from "@/components/ui/dialog";
import { allNavItems } from "./nav";

interface WatchHit {
  id: number;
  brand: string;
  model: string;
}

interface Command {
  id: string;
  group: string;
  label: string;
  shortcut?: string;
  icon: React.ComponentType<{ className?: string }>;
  run: () => void;
}

export interface PaletteAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Shown as a key hint, e.g. "N". */
  shortcut?: string;
  keywords?: string;
  run: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions?: PaletteAction[];
}

/** ⌘K: jump to any page or find a watch by brand/model. */
export function CommandPalette({ open, onOpenChange, actions = [] }: CommandPaletteProps) {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState("");
  // Results are stored with the query they answer, so stale results never show.
  const [result, setResult] = useState<{ q: string; hits: WatchHit[] }>({ q: "", hits: [] });
  const trimmed = query.trim();
  const wantsSearch = trimmed.length >= 2;
  const watches = wantsSearch && result.q === trimmed ? result.hits : [];
  const searching = wantsSearch && result.q !== trimmed;
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  // Debounced watch search.
  useEffect(() => {
    if (!open || !wantsSearch) return;
    const q = trimmed;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/watches/search?q=${encodeURIComponent(q)}&limit=8`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : []))
        .then((hits: WatchHit[]) => {
          setResult({ q, hits: Array.isArray(hits) ? hits : [] });
          setActive(0);
        })
        .catch(() => {
          if (!ctrl.signal.aborted) setResult({ q, hits: [] });
        });
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [trimmed, wantsSearch, open]);

  const commands = useMemo<Command[]>(() => {
    const q = query.trim().toLowerCase();
    const pages = allNavItems
      .filter((i) => !q || `${i.label} ${i.keywords ?? ""}`.toLowerCase().includes(q))
      .map<Command>((i) => ({
        id: `nav:${i.href}`,
        group: "Go to",
        label: i.label,
        icon: i.icon,
        run: () => go(i.href),
      }));
    const watchCmds = watches.map<Command>((w) => ({
      id: `watch:${w.id}`,
      group: "Watches",
      label: `${w.brand} ${w.model}`,
      icon: Watch,
      run: () => go(`/inventory/${w.id}`),
    }));
    const actionCmds = actions
      .filter((a) => !q || `${a.label} ${a.keywords ?? ""}`.toLowerCase().includes(q))
      .map<Command>((a) => ({
        id: `action:${a.id}`,
        group: "Actions",
        label: a.label,
        icon: a.icon,
        shortcut: a.shortcut,
        run: () => {
          onOpenChange(false);
          a.run();
        },
      }));
    return [...actionCmds, ...watchCmds, ...pages];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, result, actions]);

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, commands.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      commands[active]?.run();
    }
  };

  let lastGroup = "";

  return (
    <BaseDialog.Root
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setQuery("");
      }}
    >
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className={backdropClasses} />
        <BaseDialog.Popup
          className={cn(
            "fixed left-1/2 top-[12vh] z-50 flex w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 flex-col overflow-hidden rounded-xl bg-popover text-popover-foreground shadow-overlay outline-none",
            "transition-[opacity,scale] duration-150 ease-out data-starting-style:scale-[0.98] data-starting-style:opacity-0 data-ending-style:opacity-0"
          )}
        >
          <BaseDialog.Title className="sr-only">Search and jump to</BaseDialog.Title>
          <div className="flex items-center gap-3 border-b border-border px-4">
            {searching ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
            ) : (
              <Search className="size-4 text-muted-foreground" aria-hidden />
            )}
            <input
              autoFocus
              role="combobox"
              aria-expanded
              aria-controls={listId}
              aria-activedescendant={commands[active] ? `${listId}-${active}` : undefined}
              aria-label="Search pages and watches"
              placeholder="Find a watch or go to a page…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              className="h-12 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-placeholder"
            />
            <Kbd>esc</Kbd>
          </div>
          <div ref={listRef} id={listId} role="listbox" className="max-h-[min(24rem,60vh)] overflow-y-auto p-2">
            {commands.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                {searching ? "Searching…" : `No pages or watches match “${query}”.`}
              </p>
            ) : (
              commands.map((cmd, i) => {
                const header = cmd.group !== lastGroup ? cmd.group : null;
                lastGroup = cmd.group;
                return (
                  <div key={cmd.id}>
                    {header && (
                      <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/80">
                        {header}
                      </p>
                    )}
                    <div
                      id={`${listId}-${i}`}
                      role="option"
                      aria-selected={i === active}
                      data-index={i}
                      onMouseMove={() => setActive(i)}
                      onClick={cmd.run}
                      className={cn(
                        "flex h-10 cursor-default items-center gap-3 rounded-md px-3 text-sm",
                        i === active ? "bg-accent text-foreground" : "text-foreground/90"
                      )}
                    >
                      <cmd.icon className="size-4 text-muted-foreground" />
                      <span className="flex-1 truncate">{cmd.label}</span>
                      {cmd.shortcut && <Kbd>{cmd.shortcut}</Kbd>}
                      {i === active && <CornerDownLeft className="size-3.5 text-muted-foreground" aria-hidden />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
