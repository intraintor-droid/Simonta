import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/current-user";
import { CategoryTable } from "@/components/shared/category-table";
import type { WorkCategory } from "@/types";

export default async function MasterKategoriPage() {
  const profile = await requireRole(["SUPERADMIN", "ADMIN", "USER"]);
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("work_categories")
    .select("*")
    .order("code", { ascending: true });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Master Kategori</h1>
        <p className="text-sm text-slate-500">Kelola kategori pekerjaan.</p>
      </div>
      <CategoryTable
        initialData={(categories as WorkCategory[]) ?? []}
        canManage={profile.role === "SUPERADMIN"}
      />
    </div>
  );
}
