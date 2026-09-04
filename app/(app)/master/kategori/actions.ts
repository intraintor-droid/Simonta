"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/current-user";
import { categoryFormSchema, type CategoryFormValues } from "@/lib/validations/master";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function createCategory(values: CategoryFormValues) {
  const profile = await requireRole(["SUPERADMIN"]);
  const parsed = categoryFormSchema.parse(values);
  const supabase = await createClient();

  const { data, error } = await supabase.from("work_categories").insert(parsed).select().single();
  if (error) throw new Error(error.message);

  await logAudit(supabase, {
    userId: profile.id,
    action: "CREATE_CATEGORY",
    module: "CATEGORY",
    recordId: data.id,
    newData: parsed,
  });

  revalidatePath("/master/kategori");
  return data;
}

export async function updateCategory(id: string, values: CategoryFormValues) {
  const profile = await requireRole(["SUPERADMIN"]);
  const parsed = categoryFormSchema.parse(values);
  const supabase = await createClient();

  const { data: oldData } = await supabase
    .from("work_categories")
    .select("*")
    .eq("id", id)
    .single();

  const { data, error } = await supabase
    .from("work_categories")
    .update(parsed)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);

  await logAudit(supabase, {
    userId: profile.id,
    action: "UPDATE_CATEGORY",
    module: "CATEGORY",
    recordId: id,
    oldData,
    newData: parsed,
  });

  revalidatePath("/master/kategori");
  return data;
}

export async function toggleCategoryActive(id: string, isActive: boolean) {
  const profile = await requireRole(["SUPERADMIN"]);
  const supabase = await createClient();

  const { error } = await supabase
    .from("work_categories")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) throw new Error(error.message);

  await logAudit(supabase, {
    userId: profile.id,
    action: isActive ? "ACTIVATE_CATEGORY" : "DEACTIVATE_CATEGORY",
    module: "CATEGORY",
    recordId: id,
  });

  revalidatePath("/master/kategori");
}

/**
 * Hard delete kategori. `works.category_id` memakai `on delete set null`, jadi
 * secara teknis aman — SUPERADMIN akan diberi tahu berapa pekerjaan yang memakai
 * kategori ini sebelum konfirmasi hapus.
 */
export async function deleteCategory(id: string) {
  const profile = await requireRole(["SUPERADMIN"]);
  const supabase = await createClient();

  const { data: oldData } = await supabase
    .from("work_categories")
    .select("*")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("work_categories").delete().eq("id", id);
  if (error) throw new Error(error.message);

  await logAudit(supabase, {
    userId: profile.id,
    action: "DELETE_CATEGORY",
    module: "CATEGORY",
    recordId: id,
    oldData,
  });

  revalidatePath("/master/kategori");
}

export async function getCategoryUsageCount(id: string) {
  await requireRole(["SUPERADMIN"]);
  const supabase = await createClient();
  const { count } = await supabase
    .from("works")
    .select("*", { count: "exact", head: true })
    .eq("category_id", id);
  return { workCount: count ?? 0 };
}
