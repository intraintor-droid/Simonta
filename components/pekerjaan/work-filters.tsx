"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { WORK_STATUS_LABEL, WORK_PRIORITY_LABEL } from "@/types";

export function WorkFilters({ units }: { units: { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [, startTransition] = useTransition();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set("page", "1");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Cari nomor / nama pekerjaan..."
          className="pl-8"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && updateParam("q", q)}
          onBlur={() => updateParam("q", q)}
        />
      </div>

      <select
        className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        defaultValue={searchParams.get("status") ?? ""}
        onChange={(e) => updateParam("status", e.target.value)}
      >
        <option value="">Semua Status</option>
        {Object.entries(WORK_STATUS_LABEL).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <select
        className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        defaultValue={searchParams.get("priority") ?? ""}
        onChange={(e) => updateParam("priority", e.target.value)}
      >
        <option value="">Semua Prioritas</option>
        {Object.entries(WORK_PRIORITY_LABEL).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <select
        className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        defaultValue={searchParams.get("unit") ?? ""}
        onChange={(e) => updateParam("unit", e.target.value)}
      >
        <option value="">Semua Unit</option>
        {units.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>

      <select
        className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        defaultValue={searchParams.get("sort") ?? "created_at.desc"}
        onChange={(e) => updateParam("sort", e.target.value)}
      >
        <option value="created_at.desc">Terbaru</option>
        <option value="deadline.asc">Deadline Terdekat</option>
        <option value="progress.desc">Progress Tertinggi</option>
        <option value="priority.desc">Prioritas</option>
      </select>
    </div>
  );
}
