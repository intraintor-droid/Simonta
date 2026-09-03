import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/current-user";
import { can, canUpdateWorkProgress } from "@/lib/permissions";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, cn } from "@/lib/utils";
import { getDeadlineIndicator, DEADLINE_INDICATOR_COLOR } from "@/lib/utils/deadline";
import { WORK_STATUS_LABEL, WORK_PRIORITY_LABEL, type Work, type WorkUpdate, type WorkDocument } from "@/types";
import { WorkTimeline } from "@/components/pekerjaan/work-timeline";
import { DocumentUploader } from "@/components/pekerjaan/document-uploader";
import { ProgressUpdateForm } from "@/components/pekerjaan/progress-update-form";

export default async function WorkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireUser();
  const supabase = await createClient();

  const { data: work } = await supabase
    .from("works")
    .select(
      "*, unit:units(id,name,code), category:work_categories(id,name,code), responsible:profiles!works_responsible_user_id_fkey(id,full_name,nip,position,unit_id)"
    )
    .eq("id", id)
    .single();

  if (!work) notFound();

  const [{ data: assigneesRaw }, { data: updates }, { data: documents }] = await Promise.all([
    supabase.from("work_assignees").select("profiles(id, full_name, position)").eq("work_id", id),
    supabase
      .from("work_updates")
      .select("*")
      .eq("work_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("work_documents").select("*").eq("work_id", id).order("created_at", { ascending: false }),
  ]);

  const w = work as Work;
  const assignees = ((assigneesRaw ?? []) as unknown as {
    profiles: { id: string; full_name: string; position: string | null } | null;
  }[])
    .map((a) => a.profiles)
    .filter((p): p is { id: string; full_name: string; position: string | null } => Boolean(p));
  const indicator = getDeadlineIndicator(w.deadline, w.status);

  const canEditFull = can(profile.role, "work:update:full");
  const canEditProgress = canUpdateWorkProgress(profile.role, profile.id, {
    responsible_user_id: w.responsible_user_id,
    assigneeIds: assignees.map((a) => a.id),
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/pekerjaan"
            className="mb-2 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke daftar pekerjaan
          </Link>
          <h1 className="text-xl font-semibold">{w.title}</h1>
          <p className="font-mono text-xs text-slate-400">{w.work_number}</p>
        </div>
        {canEditFull && (
          <Link href={`/pekerjaan/${id}/edit`} className={buttonVariants({ variant: "outline" })}>
            <Pencil className="h-4 w-4" /> Edit
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Pekerjaan</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <Info label="Kategori" value={w.category?.name ?? "-"} />
              <Info label="Unit" value={w.unit?.name ?? "-"} />
              <Info
                label="Prioritas"
                value={<Badge variant="warning">{WORK_PRIORITY_LABEL[w.priority]}</Badge>}
              />
              <Info label="Status" value={<Badge variant="info">{WORK_STATUS_LABEL[w.status]}</Badge>} />
              <Info label="Tanggal Mulai" value={formatDate(w.start_date)} />
              <Info label="Deadline" value={formatDate(w.deadline)} />
              <div className="col-span-2">
                <p className="mb-1 text-xs text-slate-400">Progress</p>
                <div className="flex items-center gap-2">
                  <Progress value={w.progress} className="flex-1" />
                  <span className="text-xs font-medium">{w.progress}%</span>
                </div>
              </div>
              <div className="col-span-2">
                <span
                  className={cn(
                    "inline-block w-fit rounded-full border px-2 py-0.5 text-xs font-medium",
                    DEADLINE_INDICATOR_COLOR[indicator]
                  )}
                >
                  {indicator}
                </span>
              </div>
              {w.description && (
                <div className="col-span-2">
                  <p className="mb-1 text-xs text-slate-400">Deskripsi</p>
                  <p className="text-slate-600 dark:text-slate-300">{w.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Penanggung Jawab & Pelaksana</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              {w.responsible && (
                <div className="rounded-lg border border-slate-100 p-3 dark:border-slate-800">
                  <p className="text-xs text-slate-400">Penanggung Jawab</p>
                  <p className="font-medium">{w.responsible.full_name}</p>
                  <p className="text-xs text-slate-500">
                    {w.responsible.position ?? "-"} {w.responsible.nip ? `· NIP ${w.responsible.nip}` : ""}
                  </p>
                </div>
              )}
              {assignees.length > 0 && (
                <div>
                  <p className="mb-1 text-xs text-slate-400">Pelaksana</p>
                  <ul className="flex flex-wrap gap-2">
                    {assignees.map((a) => (
                      <li
                        key={a.id}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs dark:border-slate-700"
                      >
                        {a.full_name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dokumen Pendukung</CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentUploader workId={id} initialDocuments={(documents as WorkDocument[]) ?? []} />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          {canEditProgress && (
            <Card>
              <CardHeader>
                <CardTitle>Update Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressUpdateForm workId={id} currentProgress={w.progress} currentStatus={w.status} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkTimeline updates={(updates as WorkUpdate[]) ?? []} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <div className="font-medium text-slate-800 dark:text-slate-100">{value}</div>
    </div>
  );
}
