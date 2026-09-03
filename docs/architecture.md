# SIMONTA — Arsitektur Aplikasi

## 1. Overview
SIMONTA (Sistem Monitoring Pekerjaan) adalah aplikasi internal untuk Kantor Pertanahan
Kota Cimahi untuk memonitor pekerjaan, progress, deadline, dan dokumen pendukung.

## 2. Stack
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + komponen UI custom (pola shadcn/ui)
- Supabase: Postgres, Auth, Storage, Row Level Security
- React Hook Form + Zod
- Recharts untuk visualisasi
- Deployment: Vercel

## 3. ERD Konseptual

```
auth.users (Supabase Auth)
   │ 1:1
   ▼
profiles ───────────────┐
   │ N:1                │ 1:N
   ▼                    ▼
units              notifications
   │ 1:N
   ▼
works ───────────────────────────────┐
   │ N:1        │ 1:N        │ 1:N   │ 1:N
   ▼            ▼            ▼       ▼
work_categories work_assignees work_updates work_documents
                     │
                     ▼ N:1
                  profiles

profiles ─── 1:N ─── audit_logs
```

Relasi kunci:
- `profiles.id` = `auth.users.id` (FK, 1:1)
- `profiles.unit_id` → `units.id`
- `works.unit_id` → `units.id`
- `works.category_id` → `work_categories.id`
- `works.responsible_user_id` → `profiles.id`
- `work_assignees.work_id` → `works.id`, `work_assignees.user_id` → `profiles.id` (many-to-many pelaksana)
- `work_updates.work_id` → `works.id` (history progress/status, append-only)
- `work_documents.work_id` → `works.id`, file fisik di Supabase Storage bucket `work-documents`
- `notifications.user_id` → `profiles.id`
- `audit_logs.user_id` → `profiles.id`

## 4. Lapisan Otorisasi (defense in depth)
1. **Frontend**: sembunyikan aksi yang tidak relevan (UX only, bukan security boundary).
2. **Server (Route Handlers / Server Actions)**: setiap mutasi memverifikasi session +
   role dari tabel `profiles` sebelum menyentuh Supabase, memakai `lib/permissions`.
3. **Database (RLS)**: policy Postgres adalah *source of truth* terakhir — bahkan jika
   layer server/frontend gagal, RLS mencegah akses lintas-role.

## 5. Alur Autentikasi
1. User login via Supabase Auth (email/password) di `/login`.
2. Supabase mengembalikan session (JWT) → disimpan sebagai HTTP-only cookie lewat
   `@supabase/ssr`.
3. `middleware.ts` memvalidasi session di setiap request ke route terproteksi dan
   mengambil `role` dari `profiles` untuk RBAC route-level.
4. Server Components/Route Handlers memakai `createServerClient` (cookie-based) —
   tidak pernah memakai service role key di client.

## 6. Permission Matrix
Lihat `docs/rbac.md`.

## 7. Struktur Folder
```
app/            → routes (App Router)
components/     → UI components (ui/, layout/, dashboard/, pekerjaan/, users/, shared/)
lib/            → supabase clients, auth helpers, permission checks, zod schemas, utils
types/          → tipe TypeScript domain (Work, Profile, dll)
hooks/          → custom hooks client-side
supabase/       → migrations SQL + seed development
docs/           → dokumentasi developer
```
