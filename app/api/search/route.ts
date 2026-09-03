import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/current-user";

export async function GET(req: Request) {
  await requireUser();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ data: [] });

  const supabase = await createClient();

  // RLS otomatis membatasi baris sesuai role (SUPERADMIN/ADMIN lihat semua, USER hanya miliknya).
  const { data, error } = await supabase
    .from("works")
    .select("id, work_number, title, status, unit:units(name), category:work_categories(name)")
    .or(`title.ilike.%${q}%,work_number.ilike.%${q}%`)
    .limit(10);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}
