import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/current-user";
import { UserTable } from "@/components/users/user-table";
import type { Profile } from "@/types";

interface SearchParams {
  q?: string;
  role?: string;
  unit?: string;
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireRole(["SUPERADMIN"]);
  const sp = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("profiles").select("*, unit:units(id,name)").order("full_name");
  if (sp.q) query = query.or(`full_name.ilike.%${sp.q}%,email.ilike.%${sp.q}%,nip.ilike.%${sp.q}%`);
  if (sp.role) query = query.eq("role", sp.role);
  if (sp.unit) query = query.eq("unit_id", sp.unit);

  const { data: users } = await query;
  const { data: units } = await supabase.from("units").select("id, name").eq("is_active", true);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">User Management</h1>
        <p className="text-sm text-slate-500">Kelola akun pengguna, role, dan unit kerja.</p>
      </div>
      <UserTable
        initialData={(users as (Profile & { unit: { id: string; name: string } | null })[]) ?? []}
        units={units ?? []}
      />
    </div>
  );
}
