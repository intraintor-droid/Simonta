"use server";

import { createClient } from "@/lib/supabase/server";
import { loginFormSchema } from "@/lib/validations/master";
import { redirect } from "next/navigation";

export interface LoginState {
  error?: string;
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = loginFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Email atau password salah." };
  }

  // Cek status aktif akun
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", data.user.id)
    .single();

  if (!profile?.is_active) {
    await supabase.auth.signOut();
    return { error: "Akun Anda dinonaktifkan. Hubungi Superadmin." };
  }

  // Audit log
  await supabase.from("audit_logs").insert({
    user_id: data.user.id,
    action: "LOGIN",
    module: "AUTH",
    record_id: data.user.id,
  });

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "LOGOUT",
      module: "AUTH",
      record_id: user.id,
    });
  }

  await supabase.auth.signOut();
  redirect("/login");
}
