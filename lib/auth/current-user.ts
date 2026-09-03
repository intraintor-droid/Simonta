import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";
import { redirect } from "next/navigation";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (profile as Profile) ?? null;
}

/** Dipakai di Server Component/Route Handler yang wajib login. Redirect jika tidak. */
export async function requireUser(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile || !profile.is_active) {
    redirect("/login");
  }
  return profile;
}

/** Redirect ke /403 jika role tidak sesuai. */
export async function requireRole(roles: Profile["role"][]): Promise<Profile> {
  const profile = await requireUser();
  if (!roles.includes(profile.role)) {
    redirect("/403");
  }
  return profile;
}
