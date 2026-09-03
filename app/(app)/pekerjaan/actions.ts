"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/current-user";
import { can, canUpdateWorkProgress, PermissionError } from "@/lib/permissions";
import {
  workFormSchema,
  workProgressUpdateSchema,
  type WorkFormValues,
  type WorkProgressUpdateValues,
} from "@/lib/validations/work";
import { logAudit, notifyUsers } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function createWork(values: WorkFormValues) {
  const profile = await requireUser();
  if (!can(profile.role, "work:create")) throw new PermissionError();

  const parsed = workFormSchema.parse(values);
  const { assignee_ids, ...workData } = parsed;
  const supabase = await createClient();

  const { data: work, error } = await supabase
    .from("works")
    .insert({ ...workData, created_by: profile.id })
    .select()
    .single();
  if (error) throw new Error(error.message);

  if (assignee_ids.length > 0) {
    await supabase
      .from("work_assignees")
      .insert(assignee_ids.map((user_id) => ({ work_id: work.id, user_id })));
  }

  await supabase.from("work_updates").insert({
    work_id: work.id,
    user_id: profile.id,
    progress: work.progress,
    status: work.status,
    notes: "Pekerjaan dibuat",
  });

  const notifyIds = [workData.responsible_user_id, ...assignee_ids].filter(
    (id): id is string => Boolean(id) && id !== profile.id
  );
  await notifyUsers(supabase, {
    userIds: notifyIds,
    title: "Pekerjaan baru ditugaskan",
    message: work.title,
    type: "WORK_ASSIGNED",
    relatedWorkId: work.id,
  });

  await logAudit(supabase, {
    userId: profile.id,
    action: "CREATE_WORK",
    module: "WORK",
    recordId: work.id,
    newData: workData,
  });

  revalidatePath("/pekerjaan");
  revalidatePath("/dashboard");
  return work;
}

export async function updateWorkFull(id: string, values: WorkFormValues) {
  const profile = await requireUser();
  if (!can(profile.role, "work:update:full")) throw new PermissionError();

  const parsed = workFormSchema.parse(values);
  const { assignee_ids, ...workData } = parsed;
  const supabase = await createClient();

  const { data: oldData } = await supabase.from("works").select("*").eq("id", id).single();

  const { data: work, error } = await supabase
    .from("works")
    .update(workData)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);

  // Sinkronkan assignees (hapus lalu insert ulang — sederhana & konsisten)
  await supabase.from("work_assignees").delete().eq("work_id", id);
  if (assignee_ids.length > 0) {
    await supabase
      .from("work_assignees")
      .insert(assignee_ids.map((user_id) => ({ work_id: id, user_id })));
  }

  if (oldData?.status !== work.status || oldData?.progress !== work.progress) {
    await supabase.from("work_updates").insert({
      work_id: id,
      user_id: profile.id,
      progress: work.progress,
      status: work.status,
      notes: "Data pekerjaan diperbarui",
    });
  }

  await logAudit(supabase, {
    userId: profile.id,
    action: "UPDATE_WORK",
    module: "WORK",
    recordId: id,
    oldData,
    newData: workData,
  });

  revalidatePath("/pekerjaan");
  revalidatePath(`/pekerjaan/${id}`);
  revalidatePath("/dashboard");
  return work;
}

export async function updateWorkProgress(id: string, values: WorkProgressUpdateValues) {
  const profile = await requireUser();
  const supabase = await createClient();

  const { data: work } = await supabase
    .from("works")
    .select("id, responsible_user_id, status, progress")
    .eq("id", id)
    .single();
  if (!work) throw new Error("Pekerjaan tidak ditemukan");

  const { data: assignees } = await supabase
    .from("work_assignees")
    .select("user_id")
    .eq("work_id", id);
  const assigneeIds = (assignees ?? []).map((a) => a.user_id);

  if (!canUpdateWorkProgress(profile.role, profile.id, { ...work, assigneeIds })) {
    throw new PermissionError();
  }

  const parsed = workProgressUpdateSchema.parse(values);
  const statusChanged = parsed.status !== work.status;
  const progressChanged = parsed.progress !== work.progress;

  const { data: updated, error } = await supabase
    .from("works")
    .update({ progress: parsed.progress, status: parsed.status, notes: parsed.notes })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);

  await supabase.from("work_updates").insert({
    work_id: id,
    user_id: profile.id,
    progress: parsed.progress,
    status: parsed.status,
    notes: parsed.notes,
  });

  const notifyIds = [work.responsible_user_id, ...assigneeIds].filter(
    (uid): uid is string => Boolean(uid) && uid !== profile.id
  );
  if (statusChanged) {
    await notifyUsers(supabase, {
      userIds: notifyIds,
      title: "Status pekerjaan berubah",
      message: `Status berubah menjadi ${parsed.status}`,
      type: "STATUS_CHANGED",
      relatedWorkId: id,
    });
  }
  if (progressChanged) {
    await notifyUsers(supabase, {
      userIds: notifyIds,
      title: "Progress pekerjaan diperbarui",
      message: `Progress: ${parsed.progress}%`,
      type: "PROGRESS_CHANGED",
      relatedWorkId: id,
    });
  }

  await logAudit(supabase, {
    userId: profile.id,
    action: statusChanged ? "UPDATE_STATUS" : "UPDATE_PROGRESS",
    module: "WORK",
    recordId: id,
    oldData: { status: work.status, progress: work.progress },
    newData: { status: parsed.status, progress: parsed.progress },
  });

  revalidatePath(`/pekerjaan/${id}`);
  revalidatePath("/pekerjaan");
  revalidatePath("/dashboard");
  return updated;
}

export async function deleteWork(id: string) {
  const profile = await requireUser();
  if (!can(profile.role, "work:delete")) throw new PermissionError();

  const supabase = await createClient();
  const { data: oldData } = await supabase.from("works").select("*").eq("id", id).single();

  const { error } = await supabase.from("works").delete().eq("id", id);
  if (error) throw new Error(error.message);

  await logAudit(supabase, {
    userId: profile.id,
    action: "DELETE_WORK",
    module: "WORK",
    recordId: id,
    oldData,
  });

  revalidatePath("/pekerjaan");
  revalidatePath("/dashboard");
}
