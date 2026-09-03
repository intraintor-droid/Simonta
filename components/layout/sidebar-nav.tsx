"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Building2,
  Tags,
  BarChart3,
  CalendarDays,
  ScrollText,
  Settings,
} from "lucide-react";
import type { UserRole } from "@/types";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["SUPERADMIN", "ADMIN", "USER"] },
  { href: "/pekerjaan", label: "Pekerjaan", icon: ClipboardList, roles: ["SUPERADMIN", "ADMIN", "USER"] },
  { href: "/kalender", label: "Kalender", icon: CalendarDays, roles: ["SUPERADMIN", "ADMIN", "USER"] },
  { href: "/laporan", label: "Laporan", icon: BarChart3, roles: ["SUPERADMIN", "ADMIN"] },
  { href: "/users", label: "User Management", icon: Users, roles: ["SUPERADMIN"] },
  { href: "/master/unit", label: "Master Unit", icon: Building2, roles: ["SUPERADMIN", "ADMIN", "USER"] },
  { href: "/master/kategori", label: "Master Kategori", icon: Tags, roles: ["SUPERADMIN", "ADMIN", "USER"] },
  { href: "/audit-log", label: "Audit Log", icon: ScrollText, roles: ["SUPERADMIN", "ADMIN"] },
  { href: "/pengaturan", label: "Pengaturan", icon: Settings, roles: ["SUPERADMIN"] },
];

export function SidebarNav({ role, onNavigate }: { role: UserRole; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <nav className="flex flex-col gap-1 p-3">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
