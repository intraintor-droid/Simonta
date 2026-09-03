"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, Loader2 } from "lucide-react";

interface SearchResult {
  id: string;
  work_number: string;
  title: string;
  status: string;
  unit: { name: string } | null;
  category: { name: string } | null;
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (query.trim().length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      return;
    }
    setLoading(true);
    timeoutRef.current = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      setResults(json.data ?? []);
      setLoading(false);
    }, 300);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [query]);

  return (
    <div className="relative hidden w-72 md:block">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Cari pekerjaan, unit, kategori..."
        className="h-9 w-full rounded-md border border-slate-300 bg-white pl-8 pr-3 text-sm dark:border-slate-700 dark:bg-slate-900"
      />
      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 z-30 mt-1 max-h-80 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          {loading && (
            <div className="flex items-center gap-2 p-3 text-xs text-slate-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Mencari...
            </div>
          )}
          {!loading && results.length === 0 && (
            <p className="p-3 text-xs text-slate-400">Tidak ditemukan.</p>
          )}
          {results.map((r) => (
            <Link
              key={r.id}
              href={`/pekerjaan/${r.id}`}
              className="block border-b border-slate-50 px-3 py-2 text-sm last:border-0 hover:bg-slate-50 dark:border-slate-800/50 dark:hover:bg-slate-800"
            >
              <p className="font-medium">{r.title}</p>
              <p className="text-xs text-slate-400">
                {r.work_number} · {r.unit?.name ?? "-"} · {r.category?.name ?? "-"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
