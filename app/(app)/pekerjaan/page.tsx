import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/permissions";
import { buttonVariants } from "@/components/ui/button";
import { WorkFilters } from "@/components/pekerjaan/work-filters";
import { WorkTable } from "@/components/pekerjaan/work-table";
import { PaginationBar } from "@/components/shared/pagination-bar";
import type { Work } from "@/types";

const PAGE_SIZE = 10;

interface SearchParams {
  q?: string;
  status?: string;
  priority?: string;
  unit?: string;
  sort?: string;
  page?: string;
}

export default async function PekerjaanPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const profile = await requireUser();
  const sp = await searchParams;
  const supabase = await createClient();

  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const sort = sp.sort ?? "created_at.desc";
  const [sortColumn, sortDir] = sort.split(".");

  let query = supabase
    .from("works")
    .select(
      "*, unit:units(id,name,code), category:work_categories(id,name,code), responsible:profiles!works_responsible_user_id_fkey(id,full_name,nip,position)",
      { count: "exact" }
    );

  if (sp.q) {
    query = query.or(`title.ilike.%${sp.q}%,work_number.ilike.%${sp.q}%`);
  }
  if (sp.status) query = query.eq("status", sp.status);
  if (sp.priority) query = query.eq("priority", sp.priority);
  if (sp.unit) query = query.eq("unit_id", sp.unit);

  query = query
    .order(sortColumn || "created_at", { ascending: sortDir === "asc" })
    .range(from, to);

  const { data: works, count } = await query;
  const { data: units } = await supabase.from("units").select("id, name").eq("is_active", true);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Pekerjaan</h1>
          <p className="text-sm text-slate-500">Monitoring seluruh pekerjaan Kantor Pertanahan.</p>
        </div>
        {can(profile.role, "work:create") && (
          <Link href="/pekerjaan/create" className={buttonVariants({})}>
            <Plus className="h-4 w-4" /> Tambah Pekerjaan
          </Link>
        )}
      </div>

      <WorkFilters units={units ?? []} />

      <WorkTable works={(works as Work[]) ?? []} canDelete={can(profile.role, "work:delete")} />

      <PaginationBar page={page} pageSize={PAGE_SIZE} total={count ?? 0} />
    </div>
  );
}
