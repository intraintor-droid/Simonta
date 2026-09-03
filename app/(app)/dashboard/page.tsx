import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/current-user";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusPieChart } from "@/components/dashboard/status-pie-chart";
import { MonthlyBarChart } from "@/components/dashboard/monthly-bar-chart";
import { UnitBarChart } from "@/components/dashboard/unit-bar-chart";
import { RecentWorkList } from "@/components/dashboard/recent-work-list";
import {
  ClipboardList,
  CircleDashed,
  Loader2 as LoaderIcon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Building2,
} from "lucide-react";
import type { Work, WorkStatus } from "@/types";

export default async function DashboardPage() {
  const profile = await requireUser();
  const supabase = await createClient();

  // Query dasar mengikuti RLS: SUPERADMIN/ADMIN lihat semua, USER hanya miliknya.
  const { data: works } = await supabase
    .from("works")
    .select("id, status, priority, progress, deadline, created_at, unit:units(name)");

  const allWorks = (works as unknown as (Pick<Work, "id" | "status" | "priority" | "progress" | "deadline" | "created_at"> & {
    unit: { name: string } | null;
  })[]) ?? [];

  const countByStatus = (status: WorkStatus) => allWorks.filter((w) => w.status === status).length;

  const total = allWorks.length;
  const belumDimulai = countByStatus("BELUM_DIMULAI");
  const berjalan = countByStatus("BERJALAN");
  const menunggu = countByStatus("MENUNGGU");
  const selesai = countByStatus("SELESAI");
  const terlambat = allWorks.filter(
    (w) => w.status !== "SELESAI" && w.deadline && new Date(w.deadline) < new Date()
  ).length;

  // Data per bulan (6 bulan terakhir) dari created_at
  const monthlyMap = new Map<string, number>();
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
    monthlyMap.set(key, 0);
  }
  allWorks.forEach((w) => {
    const d = new Date(w.created_at);
    const key = d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
    if (monthlyMap.has(key)) monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + 1);
  });

  // Per unit
  const unitMap = new Map<string, number>();
  allWorks.forEach((w) => {
    const name = w.unit?.name ?? "Tanpa Unit";
    unitMap.set(name, (unitMap.get(name) ?? 0) + 1);
  });

  let superadminExtras: { totalUsers: number; totalAdmin: number; totalUnit: number } | null = null;
  if (profile.role === "SUPERADMIN") {
    const [{ count: totalUsers }, { count: totalAdmin }, { count: totalUnit }] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "ADMIN"),
      supabase.from("units").select("*", { count: "exact", head: true }),
    ]);
    superadminExtras = {
      totalUsers: totalUsers ?? 0,
      totalAdmin: totalAdmin ?? 0,
      totalUnit: totalUnit ?? 0,
    };
  }

  const { data: recentWorks } = await supabase
    .from("works")
    .select(
      "*, unit:units(id,name,code), category:work_categories(id,name,code), responsible:profiles!works_responsible_user_id_fkey(id,full_name)"
    )
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Halo, {profile.full_name.split(" ")[0]}. Berikut ringkasan pekerjaan{" "}
          {profile.role === "USER" ? "Anda" : "Kantor Pertanahan Kota Cimahi"}.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={ClipboardList} label="Total Pekerjaan" value={total} />
        <StatCard icon={CircleDashed} label="Belum Dimulai" value={belumDimulai} />
        <StatCard icon={LoaderIcon} label="Berjalan" value={berjalan} />
        <StatCard icon={Clock} label="Menunggu" value={menunggu} />
        <StatCard icon={CheckCircle2} label="Selesai" value={selesai} color="text-emerald-600" />
        <StatCard icon={AlertTriangle} label="Terlambat" value={terlambat} color="text-red-600" />
      </div>

      {superadminExtras && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard icon={Users} label="Total User" value={superadminExtras.totalUsers} />
          <StatCard icon={Users} label="Total Admin" value={superadminExtras.totalAdmin} />
          <StatCard icon={Building2} label="Total Unit" value={superadminExtras.totalUnit} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <StatusPieChart data={{ belumDimulai, berjalan, menunggu, selesai, terlambat }} />
        <MonthlyBarChart data={Array.from(monthlyMap.entries()).map(([month, count]) => ({ month, count }))} />
        <UnitBarChart data={Array.from(unitMap.entries()).map(([unit, count]) => ({ unit, count }))} />
        <RecentWorkList works={(recentWorks as Work[]) ?? []} />
      </div>
    </div>
  );
}
