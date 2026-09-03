import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-4 text-center">
      <ShieldAlert className="h-12 w-12 text-amber-500" />
      <h1 className="text-2xl font-semibold">403 — Akses Ditolak</h1>
      <p className="max-w-sm text-sm text-slate-500">
        Anda tidak memiliki izin untuk mengakses halaman ini. Hubungi Superadmin jika Anda
        merasa ini kesalahan.
      </p>
      <Link href="/dashboard" className={buttonVariants({})}>Kembali ke Dashboard</Link>
    </div>
  );
}
