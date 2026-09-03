import { daysUntil } from "@/lib/utils";
import type { DeadlineIndicator, WorkStatus } from "@/types";
import { DEADLINE_INDICATOR } from "@/types";

/**
 * Aturan (sesuai spesifikasi):
 * > 3 hari       → AMAN
 * <= 3 hari      → MENDEKATI DEADLINE
 * deadline lewat → TERLAMBAT
 * status selesai → SELESAI (selalu menang, apa pun sisa harinya)
 */
export function getDeadlineIndicator(
  deadline: string | null,
  status: WorkStatus
): DeadlineIndicator {
  if (status === "SELESAI") return DEADLINE_INDICATOR.SELESAI;
  if (!deadline) return DEADLINE_INDICATOR.AMAN;

  const remaining = daysUntil(deadline);
  if (remaining < 0) return DEADLINE_INDICATOR.TERLAMBAT;
  if (remaining <= 3) return DEADLINE_INDICATOR.MENDEKATI;
  return DEADLINE_INDICATOR.AMAN;
}

export const DEADLINE_INDICATOR_COLOR: Record<DeadlineIndicator, string> = {
  AMAN: "bg-emerald-100 text-emerald-700 border-emerald-200",
  "MENDEKATI DEADLINE": "bg-amber-100 text-amber-700 border-amber-200",
  TERLAMBAT: "bg-red-100 text-red-700 border-red-200",
  SELESAI: "bg-sky-100 text-sky-700 border-sky-200",
};
