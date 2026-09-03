# Seed & Initial Setup — SIMONTA

## 1. Kenapa tidak ada akun/password hard-coded?
Supabase Auth mengelola password dengan hashing aman. Aplikasi ini **tidak pernah**
menyimpan password sendiri, jadi akun awal harus dibuat lewat Supabase Auth, bukan
lewat `INSERT` SQL biasa.

## 2. Membuat akun SUPERADMIN pertama
1. Buka Supabase Dashboard → **Authentication → Users → Add user**.
2. Isi email & password sementara (dev) / kirim invite (production).
3. Setelah user dibuat, trigger `handle_new_auth_user` (migration 0002) otomatis
   membuat baris di `profiles` dengan role default `USER`.
4. Jalankan SQL berikut (ganti email) untuk menaikkan jadi SUPERADMIN:
   ```sql
   update profiles set role = 'SUPERADMIN' where email = 'admin@cimahi.example';
   ```
5. Ulangi untuk akun ADMIN dan USER contoh sesuai kebutuhan testing, misalnya:
   ```sql
   update profiles set role = 'ADMIN' where email = 'staff1@cimahi.example';
   -- role USER adalah default, tidak perlu diubah
   ```

## 3. Seed data referensi (unit & kategori)
Jalankan `dev_units_categories.sql` di **development project** Supabase Anda:
```bash
psql "$SUPABASE_DB_URL" -f supabase/seed/dev_units_categories.sql
```
File ini berisi data **contoh**, bukan struktur organisasi resmi Kantor Pertanahan
Kota Cimahi — sesuaikan nama unit/kategori sebelum dipakai di production.

## 4. Import data pegawai riil (opsional, hati-hati)
Jika Anda punya daftar pegawai riil (nama, NIP, jabatan, unit) yang ingin dipakai
sebagai data awal:

1. **Jangan** commit file berisi NIP/data pribadi ke Git repository.
2. Buat akun Supabase Auth untuk tiap pegawai (lewat dashboard, invite email, atau
   Admin API — bukan lewat SQL, agar password tetap terkelola Supabase Auth).
3. Setelah akun ada, update kolom `full_name`, `nip`, `position`, `unit_id`, `role`
   di tabel `profiles` lewat Table Editor Supabase atau script import CSV lokal
   yang **tidak disimpan di repo**.
4. Tandai proses ini sebagai **internal/administratif**, bukan bagian dari deployment
   otomatis, karena menyangkut data pribadi pegawai (NIP).

## 5. Production checklist sebelum go-live
- [ ] Hapus/nonaktifkan akun testing development.
- [ ] Pastikan `dev_units_categories.sql` sudah diganti dengan data unit/kategori resmi.
- [ ] Pastikan tidak ada file berisi data pribadi (NIP dsb) yang ter-commit ke Git.
- [ ] Review ulang RLS policy (`0003_rls.sql`) di project production.
