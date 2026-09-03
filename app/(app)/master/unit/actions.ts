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
