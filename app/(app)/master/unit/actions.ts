"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/current-user";
import { unitFormSchema, type UnitFormValues } from "@/lib/validations/master";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function createUnit(values: UnitFormValues) {
  const profile = await requireRole(["SUPERADMIN"]);
  const parsed = unitFormSchema.parse(values);
  const supabase = await createClient();

  const { data, error } = await supabase.from("units").insert(parsed).select().single();
  if (error) throw new Error(error.message);

  await logAudit(supabase, {
    userId: profile.id,
    action: "CREATE_UNIT",
    module: "UNIT",
    recordId: data.id,
    newData: parsed,
  });

  revalidatePath("/master/unit");
  return data;
}

export async function updateUnit(id: string, values: UnitFormValues) {
  const profile = await requireRole(["SUPERADMIN"]);
  const parsed = unitFormSchema.parse(values);
  const supabase = await createClient();

  const { data: oldData } = await supabase.from("units").select("*").eq("id", id).single();

  const { data, error } = await supabase
    .from("units")
    .update(parsed)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);

  await logAudit(supabase, {
    userId: profile.id,
    action: "UPDATE_UNIT",
    module: "UNIT",
    recordId: id,
    oldData,
    newData: parsed,
  });

  revalidatePath("/master/unit");
  return data;
}

export async function toggleUnitActive(id: string, isActive: boolean) {
  const profile = await requireRole(["SUPERADMIN"]);
  const supabase = await createClient();

  const { error } = await supabase.from("units").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error(error.message);

  await logAudit(supabase, {
    userId: profile.id,
    action: isActive ? "ACTIVATE_UNIT" : "DEACTIVATE_UNIT",
    module: "UNIT",
    recordId: id,
  });

  revalidatePath("/master/unit");
}

/**
 * Hard delete unit. FK `works.unit_id` dan `profiles.unit_id` memakai
 * `on delete set null`, jadi secara teknis aman (tidak akan menyebabkan error
 * database) — tapi tetap kita beri tahu SUPERADMIN berapa banyak pekerjaan/user
 * yang unit-nya akan menjadi kosong, supaya tidak menghapus tanpa sadar.
 * Jika ragu, gunakan `toggleUnitActive(id, false)` saja (nonaktifkan).
 */
export async function deleteUnit(id: string) {
  const profile = await requireRole(["SUPERADMIN"]);
  const supabase = await createClient();

  const { data: oldData } = await supabase.from("units").select("*").eq("id", id).single();

  const { error } = await supabase.from("units").delete().eq("id", id);
  if (error) throw new Error(error.message);

  await logAudit(supabase, {
    userId: profile.id,
    action: "DELETE_UNIT",
    module: "UNIT",
    recordId: id,
    oldData,
  });

  revalidatePath("/master/unit");
}

export async function getUnitUsageCount(id: string) {
  await requireRole(["SUPERADMIN"]);
  const supabase = await createClient();
  const [{ count: workCount }, { count: userCount }] = await Promise.all([
    supabase.from("works").select("*", { count: "exact", head: true }).eq("unit_id", id),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("unit_id", id),
  ]);
  return { workCount: workCount ?? 0, userCount: userCount ?? 0 };
}
