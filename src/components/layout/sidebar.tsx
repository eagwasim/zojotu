"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, PanelLeftClose, PanelLeftOpen, Search, Watch } from "lucide-react";
import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";
import { activeHref, navGroups } from "./nav";

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onOpenSearch: () => void;
  pendingCount: number;
  /** Rendered inside the mobile drawer: always expanded, no collapse control. */
  variant?: "rail" | "drawer";
}

export function Sidebar({
  collapsed = false,
  onToggleCollapsed,
  onOpenSearch,
  pendingCount,
  variant = "rail",
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const current = activeHref(pathname);
  const compact = variant === "rail" && collapsed;

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-14 items-center gap-2", compact ? "justify-center px-2" : "px-5")}>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-md text-foreground"
          aria-label="Zojotu, go to dashboard"
        >
          <Watch className="size-5" strokeWidth={1.75} aria-hidden />
          {!compact && (
            <span className="font-display text-xl font-medium tracking-tight">Zojotu</span>
          )}
        </Link>
      </div>

      <div className={cn("pb-2", compact ? "px-2" : "px-3")}>
        <button
          type="button"
          onClick={onOpenSearch}
          aria-label="Search and jump to (Command K)"
          className={cn(
            "flex h-9 w-full items-center gap-2 rounded-md bg-card text-sm text-muted-foreground shadow-card transition-colors duration-150 hover:text-foreground",
            compact ? "justify-center" : "px-3"
          )}
        >
          <Search className="size-4" aria-hidden />
          {!compact && (
            <>
              <span className="flex-1 text-left">Search…</span>
              <Kbd>⌘K</Kbd>
            </>
          )}
        </button>
      </div>

      <nav aria-label="Main" className={cn("flex-1 overflow-y-auto py-2", compact ? "px-2" : "px-3")}>
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4 last:mb-0">
            {compact ? (
              <div className="mx-auto mb-2 h-px w-6 bg-border first:hidden" aria-hidden />
            ) : (
              <p className="mb-1 px-3 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/80">
                {group.label}
              </p>
            )}
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const isActive = current === item.href;
                const badge = item.href === "/services" && pendingCount > 0 ? pendingCount : null;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      title={compact ? item.label : undefined}
                      aria-label={compact ? (badge ? `${item.label}, ${badge} pending` : item.label) : undefined}
                      className={cn(
                        "relative flex h-9 items-center gap-3 rounded-md text-sm transition-colors duration-150",
                        compact ? "justify-center" : "px-3",
                        isActive
                          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <item.icon
                        className="size-4 shrink-0"
                        strokeWidth={isActive ? 2 : 1.75}
                        aria-hidden
                      />
                      {!compact && <span className="flex-1 truncate">{item.label}</span>}
                      {badge !== null &&
                        (compact ? (
                          <span
                            aria-hidden
                            className="absolute right-1.5 top-1.5 size-2 rounded-full bg-warning ring-2 ring-sidebar"
                          />
                        ) : (
                          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-warning-wash px-1.5 text-[11px] font-semibold tabular-nums text-warning-ink">
                            {badge}
                            <span className="sr-only"> pending</span>
                          </span>
                        ))}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className={cn("flex flex-col gap-0.5 border-t border-border py-3", compact ? "px-2" : "px-3")}>
        {variant === "rail" && onToggleCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "flex h-9 items-center gap-3 rounded-md text-sm text-sidebar-foreground transition-colors duration-150 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              compact ? "justify-center" : "px-3"
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" strokeWidth={1.75} aria-hidden />
            ) : (
              <PanelLeftClose className="size-4" strokeWidth={1.75} aria-hidden />
            )}
            {!compact && "Collapse"}
          </button>
        )}
        <button
          type="button"
          onClick={handleLogout}
          aria-label={compact ? "Sign out" : undefined}
          title={compact ? "Sign out" : undefined}
          className={cn(
            "flex h-9 items-center gap-3 rounded-md text-sm text-sidebar-foreground transition-colors duration-150 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            compact ? "justify-center" : "px-3"
          )}
        >
          <LogOut className="size-4" strokeWidth={1.75} aria-hidden />
          {!compact && "Sign out"}
        </button>
      </div>
    </div>
  );
}
