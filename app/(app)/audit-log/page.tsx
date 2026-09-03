import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/current-user";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ScrollText } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { AuditLog } from "@/types";

interface SearchParams {
  module?: string;
  page?: string;
}

const PAGE_SIZE = 20;

const MODULE_OPTIONS = ["AUTH", "WORK", "WORK_DOCUMENT", "UNIT", "CATEGORY", "USER"];

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireRole(["SUPERADMIN", "ADMIN"]);
  const sp = await searchParams;
  const supabase = await createClient();

  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("audit_logs")
    .select("*, actor:profiles(full_name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (sp.module) query = query.eq("module", sp.module);

  const { data: logs, count } = await query;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Audit Log</h1>
        <p className="text-sm text-slate-500">
          Catatan aktivitas sistem (read-only, tidak dapat dihapus).
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href="/audit-log"
          className="rounded-full border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          Semua
        </a>
        {MODULE_OPTIONS.map((m) => (
          <a
            key={m}
            href={`/audit-log?module=${m}`}
            className="rounded-full border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            {m}
          </a>
        ))}
      </div>

      {!logs || logs.length === 0 ? (
        <EmptyState icon={ScrollText} title="Belum ada aktivitas tercatat" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Aksi</th>
                <th className="px-4 py-3">Modul</th>
                <th className="px-4 py-3">Record ID</th>
              </tr>
            </thead>
            <tbody>
              {(logs as (AuditLog & { actor: { full_name: string } | null })[]).map((log) => (
                <tr key={log.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 text-slate-500">{formatDate(log.created_at)}</td>
                  <td className="px-4 py-3">{log.actor?.full_name ?? "System"}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{log.action}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{log.module}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">
                    {log.record_id?.slice(0, 8) ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-400">Total {count ?? 0} entri.</p>
    </div>
  );
}
