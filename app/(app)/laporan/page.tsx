import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/current-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportFilters } from "@/components/shared/report-filters";
import { ExportButtons } from "@/components/shared/export-buttons";
import type { Work } from "@/types";

interface SearchParams {
  from?: string;
  to?: string;
  unit?: string;
  category?: string;
  status?: string;
  priority?: string;
  responsible?: string;
}

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireRole(["SUPERADMIN", "ADMIN"]);
  const sp = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("works")
    .select(
      "*, unit:units(id,name), category:work_categories(id,name), responsible:profiles!works_responsible_user_id_fkey(id,full_name)"
    );

  if (sp.from) query = query.gte("start_date", sp.from);
  if (sp.to) query = query.lte("deadline", sp.to);
  if (sp.unit) query = query.eq("unit_id", sp.unit);
  if (sp.category) query = query.eq("category_id", sp.category);
  if (sp.status) query = query.eq("status", sp.status);
  if (sp.priority) query = query.eq("priority", sp.priority);
  if (sp.responsible) query = query.eq("responsible_user_id", sp.responsible);

  const { data: works } = await query;
  const list = (works as Work[]) ?? [];

  const total = list.length;
  const selesai = list.filter((w) => w.status === "SELESAI").length;
  const berjalan = list.filter((w) => w.status === "BERJALAN").length;
  const terlambat = list.filter(
    (w) => w.status !== "SELESAI" && w.deadline && new Date(w.deadline) < new Date()
  ).length;
  const completionRate = total > 0 ? Math.round((selesai / total) * 100) : 0;

  const [{ data: units }, { data: categories }] = await Promise.all([
    supabase.from("units").select("id, name"),
    supabase.from("work_categories").select("id, name"),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Laporan</h1>
          <p className="text-sm text-slate-500">Ringkasan dan export data pekerjaan sesuai filter.</p>
        </div>
        <ExportButtons works={list} />
      </div>

      <ReportFilters units={units ?? []} categories={categories ?? []} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Total Pekerjaan" value={total} />
        <SummaryCard label="Selesai" value={selesai} />
        <SummaryCard label="Berjalan" value={berjalan} />
        <SummaryCard label="Terlambat" value={terlambat} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Completion Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${completionRate}%` }} />
            </div>
            <span className="text-sm font-semibold">{completionRate}%</span>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-900">
            <tr>
              <th className="px-4 py-3">Nomor</th>
              <th className="px-4 py-3">Nama Pekerjaan</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Penanggung Jawab</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Progress</th>
            </tr>
          </thead>
          <tbody>
            {list.map((w) => (
              <tr key={w.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-4 py-3 font-mono text-xs">{w.work_number}</td>
                <td className="px-4 py-3">{w.title}</td>
                <td className="px-4 py-3 text-slate-500">{w.unit?.name ?? "-"}</td>
                <td className="px-4 py-3 text-slate-500">{w.category?.name ?? "-"}</td>
                <td className="px-4 py-3 text-slate-500">{w.responsible?.full_name ?? "-"}</td>
                <td className="px-4 py-3">{w.status}</td>
                <td className="px-4 py-3">{w.progress}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </CardContent>
    </Card>
  );
}
