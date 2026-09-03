# Deployment — SIMONTA

## 1. Setup Supabase (Project baru)

1. Buka [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Catat **Project URL** dan **anon public key** (Settings → API) — untuk
   `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Catat **service_role key** (Settings → API, bagian *Project API keys*) — untuk
   `SUPABASE_SERVICE_ROLE_KEY`. **Jangan pernah** expose ke client/browser.

### Jalankan migration (urutan penting)
Di **SQL Editor** Supabase, jalankan berurutan:
```
supabase/migrations/0001_schema.sql
supabase/migrations/0002_functions.sql
supabase/migrations/0003_rls.sql
supabase/migrations/0004_storage.sql
```
Atau via Supabase CLI:
```bash
supabase link --project-ref <project-ref>
supabase db push
```

### Buat akun awal & seed development
Ikuti `supabase/seed/README.md` untuk membuat akun SUPERADMIN pertama dan
menjalankan `supabase/seed/dev_units_categories.sql` (khusus development).

### Konfigurasi Auth
- **Authentication → URL Configuration**: set *Site URL* ke domain Vercel Anda
  (mis. `https://simonta.vercel.app`) dan tambahkan sebagai *Redirect URL* untuk
  reset password (`/auth/reset-password`).
- **Authentication → Providers**: pastikan Email/Password aktif.

### Konfigurasi Storage
Bucket `work-documents` sudah dibuat otomatis oleh `0004_storage.sql` (private,
limit 10MB, MIME whitelist). Tidak perlu langkah manual tambahan di dashboard.

## 2. GitHub

```bash
cd simonta
git init
git add .
git commit -m "feat: initial SIMONTA application"
git branch -M main
git remote add origin https://github.com/<org>/simonta.git
git push -u origin main
```

Pastikan `.env.local` **tidak ikut ter-commit** (sudah di `.gitignore` bawaan
Next.js — cek dengan `git status` sebelum commit pertama).

## 3. Vercel

1. [vercel.com/new](https://vercel.com/new) → **Import Git Repository** → pilih
   repo `simonta`.
2. Framework preset: **Next.js** (terdeteksi otomatis).
3. **Environment Variables** (Settings → Environment Variables), isi untuk
   *Production*, *Preview*, dan *Development*:
   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | dari Supabase Settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | dari Supabase Settings → API |
   | `SUPABASE_SERVICE_ROLE_KEY` | dari Supabase Settings → API (**tandai sebagai Sensitive**) |
   | `NEXT_PUBLIC_APP_URL` | URL Vercel Anda setelah deploy pertama |
4. Klik **Deploy**.
5. Setelah deploy pertama sukses, kembali ke Supabase Auth URL Configuration dan
   perbarui *Site URL* dengan domain Vercel final.

## 4. Production checklist sebelum go-live

- [ ] `npm run lint`, `npx tsc --noEmit`, `npm run build` semua lolos (sudah divalidasi di repo ini)
- [ ] RLS aktif di semua tabel (cek Supabase Dashboard → Authentication → Policies)
- [ ] Akun SUPERADMIN production dibuat (bukan akun testing)
- [ ] Data unit/kategori sudah diganti dari data contoh ke data resmi
- [ ] Environment variable di Vercel sudah benar untuk *Production*
- [ ] Domain custom (jika ada) sudah dikonfigurasi & Site URL Supabase diperbarui
- [ ] Backup/point-in-time recovery Supabase diaktifkan sesuai kebutuhan retensi

## 5. Troubleshooting

| Gejala | Kemungkinan penyebab | Solusi |
|---|---|---|
| Redirect loop ke `/login` | Cookie Supabase tidak ter-set (domain mismatch) | Pastikan `NEXT_PUBLIC_SUPABASE_URL` benar & Site URL Supabase sesuai domain Vercel |
| Data tidak muncul padahal ada di DB | RLS memblokir | Cek role user di `profiles`, cek policy terkait tabel |
| Upload dokumen gagal 400 | MIME/ekstensi tidak diizinkan atau > 10MB | Lihat pesan error, sesuaikan file |
| Build gagal di Vercel tapi sukses lokal | Env var belum diset di Vercel | Cek Settings → Environment Variables |
| User baru tidak muncul di `profiles` | Trigger `on_auth_user_created` belum berjalan (migration 0002 belum dijalankan) | Jalankan ulang `0002_functions.sql` |
