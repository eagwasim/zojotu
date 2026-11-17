import {
  BookOpen,
  Cog,
  HandCoins,
  LayoutDashboard,
  Receipt,
  Settings,
  Users,
  Watch,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Extra words the command palette should match on. */
  keywords?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: "Stock",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, keywords: "home overview profit" },
      { href: "/inventory", label: "Inventory", icon: Watch, keywords: "watches stock" },
      { href: "/sales", label: "Sales", icon: HandCoins, keywords: "sold revenue" },
      { href: "/parts", label: "Parts & mods", icon: Cog, keywords: "parts mods costs" },
    ],
  },
  {
    label: "Workshop",
    items: [
      { href: "/services", label: "Service jobs", icon: Wrench, keywords: "repairs jobs" },
      { href: "/service-catalog", label: "Service catalog", icon: BookOpen, keywords: "prices" },
      { href: "/customers", label: "Customers", icon: Users, keywords: "clients" },
    ],
  },
  {
    label: "Business",
    items: [
      { href: "/expenses", label: "Expenses", icon: Receipt, keywords: "costs overhead" },
      { href: "/settings", label: "Settings", icon: Settings, keywords: "account users" },
    ],
  },
];

export const allNavItems = navGroups.flatMap((g) => g.items);

/** Longest matching prefix wins, so /services/12 highlights Service jobs, not something shorter. */
export function activeHref(pathname: string): string | undefined {
  return allNavItems
    .filter((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}
