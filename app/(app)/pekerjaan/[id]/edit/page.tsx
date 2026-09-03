import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/permissions";
import { WorkForm } from "@/components/pekerjaan/work-form";

export default async function EditWorkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireUser();
  if (!can(profile.role, "work:update:full")) redirect("/403");

  const supabase = await createClient();
  const [{ data: work }, { data: categories }, { data: units }, { data: users }, { data: assignees }] =
    await Promise.all([
      supabase.from("works").select("*").eq("id", id).single(),
      supabase.from("work_categories").select("id, name").eq("is_active", true),
      supabase.from("units").select("id, name").eq("is_active", true),
      supabase.from("profiles").select("id, full_name").eq("is_active", true),
      supabase.from("work_assignees").select("user_id").eq("work_id", id),
    ]);

  if (!work) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Edit Pekerjaan</h1>
        <p className="text-sm text-slate-500">{work.work_number} — {work.title}</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <WorkForm
          workId={id}
          defaultValues={{
            work_number: work.work_number,
            title: work.title,
            description: work.description ?? "",
            category_id: work.category_id ?? "",
            unit_id: work.unit_id ?? "",
            responsible_user_id: work.responsible_user_id ?? "",
            assignee_ids: (assignees ?? []).map((a) => a.user_id),
            priority: work.priority,
            status: work.status,
            progress: work.progress,
            start_date: work.start_date ?? "",
            deadline: work.deadline ?? "",
            notes: work.notes ?? "",
          }}
          categories={categories ?? []}
          units={units ?? []}
          users={(users ?? []).map((u) => ({ id: u.id, name: u.full_name }))}
        />
      </div>
    </div>
  );
}
