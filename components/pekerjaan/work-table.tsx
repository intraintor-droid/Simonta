"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { ClipboardList } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import { getDeadlineIndicator, DEADLINE_INDICATOR_COLOR } from "@/lib/utils/deadline";
import { WORK_STATUS_LABEL, WORK_PRIORITY_LABEL, type Work } from "@/types";
import { deleteWork } from "@/app/(app)/pekerjaan/actions";

const PRIORITY_VARIANT: Record<string, "secondary" | "info" | "warning" | "destructive"> = {
  RENDAH: "secondary",
  SEDANG: "info",
  TINGGI: "warning",
  MENDESAK: "destructive",
};

const STATUS_VARIANT: Record<string, "secondary" | "info" | "warning" | "success" | "destructive"> = {
  BELUM_DIMULAI: "secondary",
  BERJALAN: "info",
  MENUNGGU: "warning",
  SELESAI: "success",
  TERLAMBAT: "destructive",
  DIBATALKAN: "secondary",
};

export function WorkTable({ works, canDelete }: { works: Work[]; canDelete: boolean }) {
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Hapus pekerjaan ini? Tindakan tidak dapat dibatalkan.")) return;
    try {
      await deleteWork(id);
      toast.success("Pekerjaan dihapus");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menghapus pekerjaan");
    }
  }

  if (works.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Belum ada pekerjaan"
        description="Tidak ada data yang cocok dengan filter saat ini."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-900">
          <tr>
            <th className="px-4 py-3">No</th>
            <th className="px-4 py-3">Nomor</th>
            <th className="px-4 py-3">Nama Pekerjaan</th>
            <th className="px-4 py-3">Unit</th>
            <th className="px-4 py-3">Penanggung Jawab</th>
            <th className="px-4 py-3">Prioritas</th>
            <th className="px-4 py-3 w-40">Progress</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Deadline</th>
            <th className="px-4 py-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {works.map((w, i) => {
            const indicator = getDeadlineIndicator(w.deadline, w.status);
            return (
              <tr key={w.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                <td className="px-4 py-3 font-mono text-xs">{w.work_number}</td>
                <td className="px-4 py-3">
                  <Link href={`/pekerjaan/${w.id}`} className="font-medium hover:underline">
                    {w.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-500">{w.unit?.name ?? "-"}</td>
                <td className="px-4 py-3 text-slate-500">{w.responsible?.full_name ?? "-"}</td>
                <td className="px-4 py-3">
                  <Badge variant={PRIORITY_VARIANT[w.priority]}>{WORK_PRIORITY_LABEL[w.priority]}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Progress value={w.progress} className="w-20" />
                    <span className="text-xs text-slate-500">{w.progress}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[w.status]}>{WORK_STATUS_LABEL[w.status]}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-600">{formatDate(w.deadline)}</span>
                    <span
                      className={cn(
                        "w-fit rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                        DEADLINE_INDICATOR_COLOR[indicator]
                      )}
                    >
                      {indicator}
                    </span>
                  </div>
                </td>
                <td className="relative px-4 py-3 text-right">
                  <button
                    onClick={() => setOpenMenu(openMenu === w.id ? null : w.id)}
                    className="rounded-full p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {openMenu === w.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                      <div className="absolute right-4 z-20 mt-1 w-40 rounded-lg border border-slate-200 bg-white py-1 text-left shadow-lg dark:border-slate-800 dark:bg-slate-900">
                        <Link
                          href={`/pekerjaan/${w.id}`}
                          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <Eye className="h-4 w-4" /> Lihat Detail
                        </Link>
                        <Link
                          href={`/pekerjaan/${w.id}/edit`}
                          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <Pencil className="h-4 w-4" /> Edit
                        </Link>
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(w.id)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="h-4 w-4" /> Hapus
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
