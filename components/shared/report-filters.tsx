"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { WORK_STATUS_LABEL, WORK_PRIORITY_LABEL } from "@/types";

export function ReportFilters({
  units,
  categories,
}: {
  units: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-1 text-xs text-slate-500">
        Dari
        <Input
          type="date"
          className="w-36"
          defaultValue={searchParams.get("from") ?? ""}
          onChange={(e) => updateParam("from", e.target.value)}
        />
      </div>
      <div className="flex items-center gap-1 text-xs text-slate-500">
        Sampai
        <Input
          type="date"
          className="w-36"
          defaultValue={searchParams.get("to") ?? ""}
          onChange={(e) => updateParam("to", e.target.value)}
        />
      </div>
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
        defaultValue={searchParams.get("category") ?? ""}
        onChange={(e) => updateParam("category", e.target.value)}
      >
        <option value="">Semua Kategori</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        defaultValue={searchParams.get("status") ?? ""}
        onChange={(e) => updateParam("status", e.target.value)}
      >
        <option value="">Semua Status</option>
        {Object.entries(WORK_STATUS_LABEL).map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <select
        className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        defaultValue={searchParams.get("priority") ?? ""}
        onChange={(e) => updateParam("priority", e.target.value)}
      >
        <option value="">Semua Prioritas</option>
        {Object.entries(WORK_PRIORITY_LABEL).map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}
