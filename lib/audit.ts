import type { SupabaseClient } from "@supabase/supabase-js";

interface AuditParams {
  userId: string;
  action: string;
  module: string;
  recordId?: string | null;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
}

export async function logAudit(supabase: SupabaseClient, params: AuditParams) {
  await supabase.from("audit_logs").insert({
    user_id: params.userId,
    action: params.action,
    module: params.module,
    record_id: params.recordId ?? null,
    old_data: params.oldData ?? null,
    new_data: params.newData ?? null,
  });
}

interface NotifyParams {
  userIds: string[];
  title: string;
  message?: string;
  type?: string;
  relatedWorkId?: string | null;
}

export async function notifyUsers(supabase: SupabaseClient, params: NotifyParams) {
  const rows = params.userIds
    .filter((id, i, arr) => arr.indexOf(id) === i)
    .map((user_id) => ({
      user_id,
      title: params.title,
      message: params.message ?? null,
      type: params.type ?? "INFO",
      related_work_id: params.relatedWorkId ?? null,
    }));
  if (rows.length === 0) return;
  await supabase.from("notifications").insert(rows);
}
