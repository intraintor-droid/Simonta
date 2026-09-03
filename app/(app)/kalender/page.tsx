import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/current-user";
import { CalendarView } from "@/components/shared/calendar-view";
import type { Work } from "@/types";

export default async function KalenderPage() {
  await requireUser();
  const supabase = await createClient();

  const { data: works } = await supabase
    .from("works")
    .select("id, work_number, title, status, priority, start_date, deadline, completed_at");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Kalender Pekerjaan</h1>
        <p className="text-sm text-slate-500">
          Tanggal mulai, deadline, dan tanggal selesai pekerjaan. Klik untuk melihat detail.
        </p>
      </div>
      <CalendarView works={(works as Work[]) ?? []} />
    </div>
  );
}
