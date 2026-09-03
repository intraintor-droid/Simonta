import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { WorkForm } from "@/components/pekerjaan/work-form";

export default async function CreateWorkPage() {
  const profile = await requireUser();
  if (!can(profile.role, "work:create")) redirect("/403");

  const supabase = await createClient();
  const [{ data: categories }, { data: units }, { data: users }] = await Promise.all([
    supabase.from("work_categories").select("id, name").eq("is_active", true),
    supabase.from("units").select("id, name").eq("is_active", true),
    supabase.from("profiles").select("id, full_name").eq("is_active", true),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Tambah Pekerjaan</h1>
        <p className="text-sm text-slate-500">Buat data pekerjaan baru untuk dimonitor.</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <WorkForm
          categories={categories ?? []}
          units={units ?? []}
          users={(users ?? []).map((u) => ({ id: u.id, name: u.full_name }))}
        />
      </div>
    </div>
  );
}
