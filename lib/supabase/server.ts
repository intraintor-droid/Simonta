import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Supabase client untuk Server Components, Server Actions, dan Route Handlers.
 * Memakai session cookie milik user yang login (anon key + RLS), BUKAN service role key.
 * Karena RLS aktif, ini tetap aman digunakan di server.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Dipanggil dari Server Component tanpa akses set cookie (aman diabaikan
            // karena middleware akan me-refresh session di request berikutnya).
          }
        },
      },
    }
  );
}

/**
 * Client dengan SERVICE ROLE KEY — HANYA dipakai di Route Handler untuk operasi
 * administratif yang memang butuh bypass RLS secara terkendali (mis. membuat user baru
 * lewat Supabase Auth Admin API). JANGAN PERNAH diimpor dari Client Component.
 */
export function createServiceRoleClient() {
  if (typeof window !== "undefined") {
    throw new Error("Service role client tidak boleh dipakai di browser.");
  }
  return createSupabaseJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
