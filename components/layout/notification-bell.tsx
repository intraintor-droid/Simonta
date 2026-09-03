"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { AppNotification } from "@/types";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    setItems((data as AppNotification[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // Memuat data awal dari server (Supabase) saat mount — pola data-fetching standar,
    // bukan turunan dari state React lain.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load, supabase]);

  const unreadCount = items.filter((n) => !n.is_read).length;

  async function markAsRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-4 py-3 text-sm font-medium dark:border-slate-800">
              Notifikasi
            </div>
            <div className="max-h-80 overflow-y-auto">
              {loading && <p className="p-4 text-xs text-slate-400">Memuat...</p>}
              {!loading && items.length === 0 && (
                <p className="p-4 text-xs text-slate-400">Belum ada notifikasi.</p>
              )}
              {items.map((n) => (
                <Link
                  key={n.id}
                  href={n.related_work_id ? `/pekerjaan/${n.related_work_id}` : "#"}
                  onClick={() => markAsRead(n.id)}
                  className={cn(
                    "block border-b border-slate-50 px-4 py-3 text-sm hover:bg-slate-50 dark:border-slate-800/50 dark:hover:bg-slate-800",
                    !n.is_read && "bg-sky-50/60 dark:bg-sky-950/20"
                  )}
                >
                  <p className="font-medium text-slate-800 dark:text-slate-100">{n.title}</p>
                  {n.message && <p className="mt-0.5 text-xs text-slate-500">{n.message}</p>}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
