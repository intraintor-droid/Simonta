import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

// Catatan: sengaja tidak memakai next/font/google agar build tidak bergantung pada
// akses jaringan ke Google Fonts saat CI/sandbox tanpa internet penuh. Di Vercel,
// bebas mengganti ke next/font/google jika diinginkan.

export const metadata: Metadata = {
  title: "SIMONTA — Kantor Pertanahan Kota Cimahi",
  description: "Sistem Monitoring Pekerjaan Kantor Pertanahan Kota Cimahi",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
