import { requireRole } from "@/lib/auth/current-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PengaturanPage() {
  const profile = await requireRole(["SUPERADMIN"]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Pengaturan</h1>
        <p className="text-sm text-slate-500">Konfigurasi umum aplikasi SIMONTA.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profil Akun</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-400">Nama</p>
            <p className="font-medium">{profile.full_name}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Email</p>
            <p className="font-medium">{profile.email}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Role</p>
            <p className="font-medium">{profile.role}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Keamanan</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-500">
          <p>
            Konfigurasi keamanan utama (RLS, service role key, kebijakan password) dikelola
            langsung lewat Supabase Dashboard demi keamanan, bukan dari UI aplikasi ini.
            Lihat <code>docs/security.md</code> untuk detail.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
