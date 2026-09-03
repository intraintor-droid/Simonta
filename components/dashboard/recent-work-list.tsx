import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ClipboardList } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { WORK_STATUS_LABEL, type Work } from "@/types";

export function RecentWorkList({ works }: { works: Work[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pekerjaan Terbaru</CardTitle>
      </CardHeader>
      <CardContent>
        {works.length === 0 ? (
          <EmptyState icon={ClipboardList} title="Belum ada pekerjaan" />
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
            {works.map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="overflow-hidden">
                  <Link href={`/pekerjaan/${w.id}`} className="truncate font-medium hover:underline">
                    {w.title}
                  </Link>
                  <p className="text-xs text-slate-400">{w.unit?.name ?? "-"} · {formatDate(w.created_at)}</p>
                </div>
                <Badge variant="secondary">{WORK_STATUS_LABEL[w.status]}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
