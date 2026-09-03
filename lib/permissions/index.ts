import type { UserRole, Work } from "@/types";

/**
 * Single source of truth untuk RBAC di layer aplikasi (server actions/route handlers).
 * RLS di database adalah lapisan pertahanan terakhir — daftar ini HARUS konsisten
 * dengan supabase/migrations/0003_rls.sql.
 */

export type Action =
  | "work:create"
  | "work:update:full" // ubah semua field (master data)
  | "work:update:progress" // hanya progress/status/notes
  | "work:delete"
  | "user:manage"
  | "user:change_role"
  | "unit:manage"
  | "category:manage"
  | "audit_log:view"
  | "audit_log:delete"
  | "report:view"
  | "report:export";

const ROLE_PERMISSIONS: Record<UserRole, Action[]> = {
  SUPERADMIN: [
    "work:create",
    "work:update:full",
    "work:update:progress",
    "work:delete",
    "user:manage",
    "user:change_role",
    "unit:manage",
    "category:manage",
    "audit_log:view",
    "report:view",
    "report:export",
  ],
  ADMIN: [
    "work:create",
    "work:update:full",
    "work:update:progress",
    "audit_log:view",
    "report:view",
    "report:export",
  ],
  USER: ["work:update:progress"],
};

export function can(role: UserRole, action: Action): boolean {
  return ROLE_PERMISSIONS[role]?.includes(action) ?? false;
}

/** Apakah user boleh mengubah progress/status pekerjaan tertentu. */
export function canUpdateWorkProgress(
  role: UserRole,
  userId: string,
  work: Pick<Work, "responsible_user_id"> & { assigneeIds?: string[] }
): boolean {
  if (role === "SUPERADMIN" || role === "ADMIN") return true;
  if (work.responsible_user_id === userId) return true;
  if (work.assigneeIds?.includes(userId)) return true;
  return false;
}

/** Mencegah ADMIN menghapus/mengubah role SUPERADMIN. */
export function canModifyTargetUser(
  actorRole: UserRole,
  targetRole: UserRole,
  _operation: "delete" | "change_role" | "deactivate"
): boolean {
  if (targetRole === "SUPERADMIN") {
    // Hanya SUPERADMIN lain yang boleh, dan bahkan itu sebaiknya dibatasi lebih lanjut
    // (mis. tidak bisa nonaktifkan diri sendiri) — dicek terpisah di route handler.
    return actorRole === "SUPERADMIN";
  }
  return actorRole === "SUPERADMIN";
}

export function assertPermission(role: UserRole, action: Action) {
  if (!can(role, action)) {
    throw new PermissionError(`Role ${role} tidak memiliki akses untuk ${action}`);
  }
}

export class PermissionError extends Error {
  status = 403;
  constructor(message = "Forbidden") {
    super(message);
    this.name = "PermissionError";
  }
}
