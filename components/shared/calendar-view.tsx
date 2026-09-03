"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
  addMonths,
  subMonths,
} from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Work } from "@/types";

interface CalendarEvent {
  workId: string;
  title: string;
  type: "MULAI" | "DEADLINE" | "SELESAI";
  date: Date;
}

const EVENT_COLOR: Record<CalendarEvent["type"], string> = {
  MULAI: "bg-sky-100 text-sky-700",
  DEADLINE: "bg-amber-100 text-amber-700",
  SELESAI: "bg-emerald-100 text-emerald-700",
};

export function CalendarView({ works }: { works: Work[] }) {
  const [cursor, setCursor] = useState(new Date());

  const events = useMemo(() => {
    const list: CalendarEvent[] = [];
    works.forEach((w) => {
      if (w.start_date) list.push({ workId: w.id, title: w.title, type: "MULAI", date: new Date(w.start_date) });
      if (w.deadline) list.push({ workId: w.id, title: w.title, type: "DEADLINE", date: new Date(w.deadline) });
      if (w.completed_at)
        list.push({ workId: w.id, title: w.title, type: "SELESAI", date: new Date(w.completed_at) });
    });
    return list;
  }, [works]);

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold capitalize">{format(cursor, "MMMM yyyy", { locale: localeId })}</h2>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={() => setCursor((c) => subMonths(c, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCursor((c) => addMonths(c, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400">
        {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dayEvents = events.filter((e) => isSameDay(e.date, day));
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[86px] rounded-lg border border-slate-100 p-1.5 text-left dark:border-slate-800",
                !isSameMonth(day, cursor) && "bg-slate-50/50 text-slate-300 dark:bg-slate-950/40",
                isSameDay(day, new Date()) && "ring-1 ring-slate-400"
              )}
            >
              <p className="text-xs">{format(day, "d")}</p>
              <div className="mt-1 flex flex-col gap-0.5">
                {dayEvents.slice(0, 2).map((e, i) => (
                  <Link
                    key={i}
                    href={`/pekerjaan/${e.workId}`}
                    className={cn("truncate rounded px-1 py-0.5 text-[10px] font-medium", EVENT_COLOR[e.type])}
                    title={e.title}
                  >
                    {e.title}
                  </Link>
                ))}
                {dayEvents.length > 2 && (
                  <span className="text-[10px] text-slate-400">+{dayEvents.length - 2} lagi</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-sky-400" /> Mulai
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-400" /> Deadline
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-400" /> Selesai
        </span>
      </div>
    </div>
  );
}
