export type UserRole = "SUPERADMIN" | "ADMIN" | "USER";

export type WorkStatus =
  | "BELUM_DIMULAI"
  | "BERJALAN"
  | "MENUNGGU"
  | "SELESAI"
  | "TERLAMBAT"
  | "DIBATALKAN";

export type WorkPriority = "RENDAH" | "SEDANG" | "TINGGI" | "MENDESAK";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  nip: string | null;
  phone: string | null;
  position: string | null;
  unit_id: string | null;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: string;
  code: string;
  name: string;
  description: string | null;
  head_user_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkCategory {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Work {
  id: string;
  work_number: string;
  title: string;
  description: string | null;
  category_id: string | null;
  unit_id: string | null;
  responsible_user_id: string | null;
  priority: WorkPriority;
  status: WorkStatus;
  progress: number;
  start_date: string | null;
  deadline: string | null;
  completed_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // relasi opsional (hasil join)
  unit?: Pick<Unit, "id" | "name" | "code"> | null;
  category?: Pick<WorkCategory, "id" | "name" | "code"> | null;
  responsible?: Pick<Profile, "id" | "full_name" | "nip" | "position"> | null;
  assignees?: Profile[];
}

export interface WorkUpdate {
  id: string;
  work_id: string;
  user_id: string | null;
  progress: number | null;
  status: WorkStatus | null;
  notes: string | null;
  created_at: string;
}

export interface WorkDocument {
  id: string;
  work_id: string;
  uploaded_by: string | null;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  type: string;
  related_work_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  module: string;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
}

export const WORK_STATUS_LABEL: Record<WorkStatus, string> = {
  BELUM_DIMULAI: "Belum Dimulai",
  BERJALAN: "Berjalan",
  MENUNGGU: "Menunggu",
  SELESAI: "Selesai",
  TERLAMBAT: "Terlambat",
  DIBATALKAN: "Dibatalkan",
};

export const WORK_PRIORITY_LABEL: Record<WorkPriority, string> = {
  RENDAH: "Rendah",
  SEDANG: "Sedang",
  TINGGI: "Tinggi",
  MENDESAK: "Mendesak",
};

export const DEADLINE_INDICATOR = {
  AMAN: "AMAN",
  MENDEKATI: "MENDEKATI DEADLINE",
  TERLAMBAT: "TERLAMBAT",
  SELESAI: "SELESAI",
} as const;

export type DeadlineIndicator =
  (typeof DEADLINE_INDICATOR)[keyof typeof DEADLINE_INDICATOR];
