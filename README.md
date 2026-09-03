# SIMONTA — Sistem Monitoring Pekerjaan Kantor Pertanahan Kota Cimahi

Aplikasi full-stack production-ready untuk memonitor pekerjaan internal Kantor
Pertanahan Kota Cimahi: progress, deadline, dokumen, dan pelaporan — dengan
autentikasi, RBAC, dan Row Level Security penuh lewat Supabase.

## Fitur

- Autentikasi Supabase Auth (email/password) + proteksi route server-side
- RBAC 3 level (SUPERADMIN, ADMIN, USER) — diperiksa di frontend, server, **dan** RLS database
- CRUD Pekerjaan, Unit, Kategori, User dengan search/filter/sort/pagination
- Monitoring progress & status dengan history timeline (append-only)
- Indikator deadline otomatis: AMAN / MENDEKATI DEADLINE / TERLAMBAT / SELESAI
- Upload dokumen ke Supabase Storage (private bucket, signed URL, validasi MIME/size)
- Notifikasi realtime (Supabase Realtime) + notification bell
- Dashboard dengan statistik & chart (Recharts) dihitung langsung dari database
- Kalender bulanan pekerjaan, Laporan dengan export CSV/Excel/PDF
- Audit log untuk seluruh aktivitas penting (append-only, tidak bisa dihapus)
- Global search, dark mode, responsive (sidebar desktop / drawer mobile)

## Tech Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Postgres,
Auth, Storage, RLS) · React Hook Form + Zod · Recharts · date-fns · Lucide React

## Struktur Proyek

```
app/(app)/        → Halaman terautentikasi (dashboard, pekerjaan, users, dst)
app/login/         → Autentikasi
app/api/           → Route handlers (upload dokumen, search)
components/        → UI components
lib/               → supabase clients, auth, permissions, validations, utils
types/             → Tipe domain TypeScript
supabase/          → Migration SQL + seed development
docs/              → Dokumentasi developer (arsitektur, database, RBAC, security, deployment, testing)
```

## Quick Start (Development)

```bash
npm install
cp .env.example .env.local   # isi dengan kredensial Supabase Anda
npm run dev
```

Sebelum menjalankan, pastikan project Supabase sudah di-setup dan migration
sudah dijalankan — lihat **docs/deployment.md**.

## Dokumentasi

| Dokumen | Isi |
|---|---|
| docs/architecture.md | ERD konseptual, alur autentikasi, struktur folder |
| docs/database.md | Skema tabel, enum, cara menjalankan migration |
| docs/rbac.md | Permission matrix lengkap per role |
| docs/security.md | Checklist keamanan & implementasinya |
| docs/testing.md | Skenario test manual auth/RBAC/CRUD/upload |
| docs/deployment.md | Panduan setup Supabase, GitHub, Vercel step-by-step |
| supabase/seed/README.md | Cara membuat akun SUPERADMIN/ADMIN/USER pertama |

## Build & Validasi

```bash
npm run lint        # ESLint — 0 error
npx tsc --noEmit    # TypeScript strict check — 0 error
npm run build       # Production build — sudah divalidasi sukses
```

## Environment Variables

Lihat `.env.example`. **`SUPABASE_SERVICE_ROLE_KEY` tidak boleh diprefix
`NEXT_PUBLIC_` dan tidak boleh di-commit** — hanya dipakai di satu server
action (`app/(app)/users/actions.ts`) untuk membuat akun user baru lewat
Supabase Auth Admin API.

## Catatan Data

Data unit, kategori, dan pengguna dalam seed development bersifat **contoh**,
bukan struktur organisasi resmi. Jangan gunakan data pribadi (NIP, dsb) nyata
di file yang ter-commit ke repository — lihat `supabase/seed/README.md` untuk
prosedur import data pegawai riil yang aman.

## Lisensi

Internal — Kantor Pertanahan Kota Cimahi.
