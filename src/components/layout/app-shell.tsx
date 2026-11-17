"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { Menu, Search, Watch } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui/icon-button";
import { backdropClasses } from "@/components/ui/dialog";
import { Sidebar } from "./sidebar";
import { CommandPalette } from "./command-palette";

const COLLAPSE_KEY = "sidebar-collapsed";
const COLLAPSE_EVENT = "sidebar-collapsed-change";

// Persisted sidebar preference, read without a hydration mismatch (server renders expanded).
function subscribeCollapsed(cb: () => void) {
  window.addEventListener(COLLAPSE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(COLLAPSE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
const readCollapsed = () => localStorage.getItem(COLLAPSE_KEY) === "1";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, () => false);
  // The drawer is open only on the page it was opened from, so navigating closes it.
  const [drawerPath, setDrawerPath] = useState<string | null>(null);
  const mobileOpen = drawerPath === pathname;
  const setMobileOpen = (open: boolean) => setDrawerPath(open ? pathname : null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const toggleCollapsed = useCallback(() => {
    localStorage.setItem(COLLAPSE_KEY, readCollapsed() ? "0" : "1");
    window.dispatchEvent(new Event(COLLAPSE_EVENT));
  }, []);

  useEffect(() => {
    fetch("/api/service-jobs?page=1&pageSize=1&status=Pending")
      .then((r) => r.json())
      .then((res) => setPendingCount(res.total || 0))
      .catch(() => {});
  }, [pathname]);

  // ⌘K / Ctrl+K opens the palette from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openSearch = () => {
    setMobileOpen(false);
    setPaletteOpen(true);
  };

  return (
    <>
      <a
        href="#main"
        className="sr-only z-[100] rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>

      {/* Desktop rail */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-border bg-sidebar transition-[width] duration-200 ease-out md:block",
          collapsed ? "w-16" : "w-60"
        )}
      >
        <Sidebar
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
          onOpenSearch={openSearch}
          pendingCount={pendingCount}
        />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/90 px-3 backdrop-blur md:hidden">
        <IconButton aria-label="Open menu" onClick={() => setMobileOpen(true)}>
          <Menu />
        </IconButton>
        <Link href="/dashboard" className="flex flex-1 items-center gap-2 text-foreground">
          <Watch className="size-5" strokeWidth={1.75} aria-hidden />
          <span className="font-display text-lg font-medium tracking-tight">Zojotu</span>
        </Link>
        <IconButton aria-label="Search" onClick={openSearch}>
          <Search />
        </IconButton>
      </header>

      {/* Mobile drawer */}
      <BaseDialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <BaseDialog.Portal>
          <BaseDialog.Backdrop className={backdropClasses} />
          <BaseDialog.Popup
            className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-sidebar shadow-overlay outline-none transition-[translate] duration-250 ease-[cubic-bezier(0.2,0,0,1)] data-ending-style:-translate-x-full data-starting-style:-translate-x-full"
          >
            <BaseDialog.Title className="sr-only">Menu</BaseDialog.Title>
            <Sidebar variant="drawer" onOpenSearch={openSearch} pendingCount={pendingCount} />
          </BaseDialog.Popup>
        </BaseDialog.Portal>
      </BaseDialog.Root>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

      <main
        id="main"
        className={cn("transition-[padding] duration-200 ease-out", collapsed ? "md:pl-16" : "md:pl-60")}
      >
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">{children}</div>
      </main>
    </>
  );
}
