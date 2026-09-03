"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, Moon, Sun, LogOut, ChevronRight } from "lucide-react";
import type { Profile } from "@/types";
import { NotificationBell } from "./notification-bell";
import { GlobalSearch } from "./global-search";
import { logoutAction } from "@/app/login/actions";

function useBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((seg, i) => ({
    label: seg.replace(/-/g, " "),
    href: "/" + segments.slice(0, i + 1).join("/"),
  }));
}

export function Topbar({
  profile,
  onOpenMobileNav,
}: {
  profile: Profile;
  onOpenMobileNav: () => void;
}) {
  const crumbs = useBreadcrumb();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // Sinkronisasi satu-arah dari DOM (class .dark yang mungkin di-set inline script)
    // ke state React saat mount — bukan loop render, hanya baca kondisi awal sekali.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <nav className="hidden items-center gap-1 text-sm text-slate-500 sm:flex">
          {crumbs.map((c, i) => (
            <span key={c.href} className="flex items-center gap-1 capitalize">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
              {c.label}
            </span>
          ))}
        </nav>
      </div>

      <GlobalSearch />

      <div className="flex items-center gap-1">
        <button
          onClick={toggleDark}
          className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <NotificationBell />
        <div className="mx-2 hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight">{profile.full_name}</p>
          <p className="text-xs leading-tight text-slate-400">{profile.role}</p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Keluar"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </header>
  );
}
