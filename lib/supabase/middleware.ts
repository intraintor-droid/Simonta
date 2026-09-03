import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/forgot-password", "/auth/callback"];

// Route prefix -> role yang diizinkan. Urutan dicek dari paling spesifik.
const ROUTE_RULES: { prefix: string; roles: Array<"SUPERADMIN" | "ADMIN" | "USER"> }[] = [
  { prefix: "/users", roles: ["SUPERADMIN"] },
  { prefix: "/master", roles: ["SUPERADMIN", "ADMIN", "USER"] }, // write dibatasi di server/RLS
  { prefix: "/audit-log", roles: ["SUPERADMIN", "ADMIN"] },
  { prefix: "/laporan", roles: ["SUPERADMIN", "ADMIN"] },
  { prefix: "/pengaturan", roles: ["SUPERADMIN"] },
  { prefix: "/pekerjaan", roles: ["SUPERADMIN", "ADMIN", "USER"] },
  { prefix: "/dashboard", roles: ["SUPERADMIN", "ADMIN", "USER"] },
  { prefix: "/kalender", roles: ["SUPERADMIN", "ADMIN", "USER"] },
];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));

  if (!user && !isPublic && path !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  if (user && !isPublic) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.is_active) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "account_inactive");
      return NextResponse.redirect(url);
    }

    const rule = ROUTE_RULES.find((r) => path.startsWith(r.prefix));
    if (rule && !rule.roles.includes(profile.role)) {
      const url = request.nextUrl.clone();
      url.pathname = "/403";
      return NextResponse.rewrite(url);
    }
  }

  if (user && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}
