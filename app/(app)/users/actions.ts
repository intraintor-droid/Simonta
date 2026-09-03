"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/current-user";
import { userFormSchema, type UserFormValues } from "@/lib/validations/master";
import { canModifyTargetUser } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createUserSchema = userFormSchema.extend({
  password: z.string().min(8, "Password minimal 8 karakter"),
});
export type CreateUserValues = z.infer<typeof createUserSchema>;

/**
 * Membuat user baru lewat Supabase Auth Admin API (service role, HANYA di server).
 * Trigger `handle_new_auth_user` otomatis membuat baris profiles; setelah itu kita
 * update field tambahan (nip, phone, position, unit_id, role) sesuai input SUPERADMIN.
 */
export async function createUser(values: CreateUserValues) {
  const actor = await requireRole(["SUPERADMIN"]);
  const parsed = createUserSchema.parse(values);

  const admin = createServiceRoleClient();
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: parsed.email,
    password: parsed.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.full_name, role: parsed.role },
  });
  if (authError || !authUser.user) {
    throw new Error(authError?.message ?? "Gagal membuat akun");
  }

  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.full_name,
      nip: parsed.nip || null,
      phone: parsed.phone || null,
      position: parsed.position || null,
      unit_id: parsed.unit_id || null,
      role: parsed.role,
      is_active: parsed.is_active,
    })
    .eq("id", authUser.user.id)
    .select()
    .single();

  if (profileError) throw new Error(profileError.message);

  await logAudit(supabase, {
    userId: actor.id,
    action: "CREATE_USER",
    module: "USER",
    recordId: authUser.user.id,
    newData: { email: parsed.email, role: parsed.role },
  });

  revalidatePath("/users");
  return profile;
}

export async function updateUser(id: string, values: UserFormValues) {
  const actor = await requireRole(["SUPERADMIN"]);
  const parsed = userFormSchema.parse(values);
  const supabase = await createClient();

  const { data: target } = await supabase.from("profiles").select("role").eq("id", id).single();
  if (!target) throw new Error("User tidak ditemukan");

  const roleChanged = target.role !== parsed.role;
  if (roleChanged && !canModifyTargetUser(actor.role, target.role, "change_role")) {
    throw new Error("Tidak diizinkan mengubah role user ini");
  }

  const { data: oldData } = await supabase.from("profiles").select("*").eq("id", id).single();

  const { data: updated, error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.full_name,
      nip: parsed.nip || null,
      phone: parsed.phone || null,
      position: parsed.position || null,
      unit_id: parsed.unit_id || null,
      role: parsed.role,
      is_active: parsed.is_active,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);

  await logAudit(supabase, {
    userId: actor.id,
    action: roleChanged ? "CHANGE_ROLE" : "UPDATE_USER",
    module: "USER",
    recordId: id,
    oldData,
    newData: parsed,
  });

  revalidatePath("/users");
  return updated;
}

export async function setUserActive(id: string, isActive: boolean) {
  const actor = await requireRole(["SUPERADMIN"]);
  const supabase = await createClient();

  const { data: target } = await supabase.from("profiles").select("role").eq("id", id).single();
  if (!target) throw new Error("User tidak ditemukan");
  if (!canModifyTargetUser(actor.role, target.role, "deactivate")) {
    throw new Error("Tidak diizinkan menonaktifkan user ini");
  }
  if (id === actor.id && !isActive) {
    throw new Error("Anda tidak dapat menonaktifkan akun Anda sendiri");
  }

  // Hindari hard delete — selalu pakai is_active (poin 16 spesifikasi).
  const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error(error.message);

  await logAudit(supabase, {
    userId: actor.id,
    action: "UPDATE_USER",
    module: "USER",
    recordId: id,
    newData: { is_active: isActive },
  });

  revalidatePath("/users");
}
