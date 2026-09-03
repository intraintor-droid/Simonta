"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client untuk dipakai di Client Components.
 * Hanya memakai anon key — aman untuk browser karena RLS aktif di semua tabel.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
