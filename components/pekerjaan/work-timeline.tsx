import { CheckCircle2, Circle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { WORK_STATUS_LABEL, type WorkUpdate } from "@/types";

export function WorkTimeline({ updates }: { updates: WorkUpdate[] }) {
  if (updates.length === 0) {
    return <p className="text-sm text-slate-400">Belum ada aktivitas.</p>;
  }

  return (
    <ol className="relative border-l border-slate-200 pl-4 dark:border-slate-800">
      {updates.map((u, i) => (
        <li key={u.id} className="mb-5 last:mb-0">
          <span className="absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-slate-950">
            {i === 0 ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <Circle className="h-3 w-3 text-slate-300" />
            )}
          </span>
          <p className="text-xs text-slate-400">
            {formatDate(u.created_at)} · {new Date(u.created_at).toLocaleTimeString("id-ID")}
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-200">
            {u.notes || (u.status ? `Status: ${WORK_STATUS_LABEL[u.status]}` : "Pembaruan pekerjaan")}
          </p>
          {u.progress !== null && (
            <p className="text-xs text-slate-400">Progress: {u.progress}%</p>
          )}
        </li>
      ))}
    </ol>
  );
}
