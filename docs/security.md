# Security — SIMONTA

## Checklist (Poin 30 spesifikasi)

| Item | Status | Keterangan |
|---|---|---|
| RLS aktif di semua tabel | ✅ | `0003_rls.sql`, tidak ada `using (true)` untuk data sensitif |
| RBAC server-side | ✅ | `lib/permissions`, dicek di setiap server action sebelum query |
| Authentication aman | ✅ | Supabase Auth, cookie httpOnly via `@supabase/ssr` |
| Tidak ada password plaintext | ✅ | Password dikelola sepenuhnya oleh Supabase Auth |
| Service role key tidak terekspos | ✅ | Hanya diimpor di `app/(app)/users/actions.ts` (server action), tidak pernah di client |
| Input divalidasi | ✅ | Zod schema di `lib/validations/*`, divalidasi ulang di server action (bukan hanya client) |
| File upload divalidasi | ✅ | MIME type + extension whitelist + limit 10MB (client & server), plus bucket-level `allowed_mime_types` |
| Tidak ada SQL injection | ✅ | Semua query lewat Supabase client (parameterized), tidak ada raw SQL string dari input user |
| Tidak ada akses data lintas role | ✅ | Dijamin RLS + `lib/permissions`, diuji manual (lihat `docs/testing.md`) |
| Audit log berjalan | ✅ | `lib/audit.ts` dipanggil di semua mutasi penting |
| Session handling benar | ✅ | Middleware refresh session tiap request, redirect otomatis jika expired/inactive |
| Unauthorized request ditolak | ✅ | Middleware (403 rewrite) + `requireRole()` di server component + RLS |
| Environment variable aman | ✅ | `.env*` di `.gitignore`, `.env.example` tanpa nilai asli |

## Detail implementasi

### Defense in depth
1. **Frontend** — menu/aksi disembunyikan sesuai role (UX saja).
2. **Server** (`lib/permissions`, `requireRole`, route handlers) — pemeriksaan
   sebelum query, melempar `PermissionError` (403) jika gagal.
3. **Database (RLS)** — lapisan terakhir yang tidak bisa dilewati walau frontend/
   server punya bug, karena Supabase mengevaluasi RLS untuk setiap query.

### Upload dokumen
- Bucket `work-documents` bersifat **private** (`public: false`).
- Validasi MIME + ekstensi di server (`app/api/works/[id]/documents/route.ts`) dan
  di level bucket Supabase Storage.
- Download memakai **signed URL** berumur 60 detik (`.../[docId]/route.ts`), bukan
  URL publik permanen.

### Audit log tidak bisa dihapus
`0003_rls.sql` sengaja tidak mendefinisikan policy `UPDATE`/`DELETE` untuk
`audit_logs` — secara default Postgres RLS menolak operasi tanpa policy yang cocok.

### Mencegah privilege escalation
- `profiles_update_self` (RLS) memaksa `role` tetap sama saat user meng-update
  profil sendiri.
- `canModifyTargetUser()` (`lib/permissions`) mencegah ADMIN mengubah/menghapus
  akun SUPERADMIN, dan mencegah SUPERADMIN menonaktifkan akunnya sendiri.

## Yang PERLU direview manual sebelum production
- [ ] Ganti seed unit/kategori contoh dengan data resmi.
- [ ] Set kebijakan password Supabase Auth (panjang minimum, dsb) di dashboard.
- [ ] Aktifkan Supabase Auth email confirmation / rate limiting sesuai kebutuhan.
- [ ] Review CORS & allowed redirect URLs di Supabase Auth settings agar sesuai
      domain Vercel production.
- [ ] Rotasi `SUPABASE_SERVICE_ROLE_KEY` secara berkala dan simpan hanya di
      Vercel Environment Variables (jangan pernah commit).
