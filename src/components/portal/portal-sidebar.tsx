"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Watch,
  PlusCircle,
  Bell,
  User,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/jobs", label: "My Jobs", icon: Watch },
  { href: "/portal/jobs/new", label: "Request Service", icon: PlusCircle },
  { href: "/portal/notifications", label: "Notifications", icon: Bell },
  { href: "/portal/profile", label: "Profile", icon: User },
];

export function PortalSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch("/api/notifications?page=1&pageSize=1")
      .then((r) => r.json())
      .then((res) => setUnreadCount(res.unreadCount || 0))
      .catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-border bg-sidebar">
      <div className="flex h-14 items-center border-b border-border px-5">
        <Link href="/portal" className="flex items-center gap-2">
          <Watch className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold text-foreground">
            Zojotu
          </span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const exactMatch = pathname === item.href;
          const prefixMatch = pathname.startsWith(item.href + "/");
          const hasMoreSpecificMatch = navItems.some(
            (other) => other.href !== item.href && other.href.startsWith(item.href) && (pathname === other.href || pathname.startsWith(other.href + "/"))
          );
          const isActive = exactMatch || (prefixMatch && !hasMoreSpecificMatch);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1">{item.label}</span>
              {item.href === "/portal/notifications" && unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border px-3 py-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
