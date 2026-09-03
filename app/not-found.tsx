import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-4 text-center">
      <FileQuestion className="h-12 w-12 text-slate-400" />
      <h1 className="text-2xl font-semibold">404 — Halaman Tidak Ditemukan</h1>
      <p className="max-w-sm text-sm text-slate-500">
        Halaman yang Anda cari tidak ada atau sudah dipindahkan.
      </p>
      <Link href="/dashboard" className={buttonVariants({})}>Kembali ke Dashboard</Link>
    </div>
  );
}
