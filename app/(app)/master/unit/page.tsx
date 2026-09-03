import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/current-user";
import { UnitTable } from "@/components/shared/unit-table";
import type { Unit } from "@/types";

export default async function MasterUnitPage() {
  const profile = await requireRole(["SUPERADMIN", "ADMIN", "USER"]);
  const supabase = await createClient();

  const { data: units } = await supabase
    .from("units")
    .select("*")
    .order("code", { ascending: true });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Master Unit</h1>
        <p className="text-sm text-slate-500">Kelola satuan kerja Kantor Pertanahan Kota Cimahi.</p>
      </div>
      <UnitTable initialData={(units as Unit[]) ?? []} canManage={profile.role === "SUPERADMIN"} />
    </div>
  );
}
