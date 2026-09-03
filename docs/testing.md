# Testing — SIMONTA

Proyek ini memakai kombinasi **manual test checklist** (karena bergantung pada
project Supabase nyata) dan panduan otomatisasi jika Anda ingin menambahkan
Playwright/Vitest di kemudian hari.

## 1. Authentication

| Skenario | Langkah | Hasil yang diharapkan |
|---|---|---|
| Login benar | Isi email/password valid, submit | Redirect ke `/dashboard`, audit log `LOGIN` tercatat |
| Login salah | Password salah | Pesan error "Email atau password salah", tidak redirect |
| Akun nonaktif | Login dengan akun `is_active = false` | Ditolak dengan pesan "Akun Anda dinonaktifkan" |
| Logout | Klik tombol logout | Redirect ke `/login`, audit log `LOGOUT` tercatat, akses `/dashboard` setelahnya redirect ke login |
| Session expired | Hapus cookie Supabase manual, refresh halaman terproteksi | Redirect ke `/login` |

## 2. RBAC

Uji dengan 3 akun berbeda (SUPERADMIN, ADMIN, USER):

| Aksi | SUPERADMIN | ADMIN | USER |
|---|---|---|---|
| Akses `/users` | ✅ | ❌ (403) | ❌ (403) |
| Akses `/master/unit` (lihat) | ✅ | ✅ | ✅ |
| Tambah unit baru | ✅ | ❌ (tombol tidak muncul + server menolak) | ❌ |
| Hapus pekerjaan | ✅ | ❌ | ❌ |
| Update progress pekerjaan sendiri | ✅ | ✅ | ✅ (hanya miliknya) |
| Update progress pekerjaan milik user lain | ✅ | ✅ | ❌ (403 dari server action) |
| Lihat audit log | ✅ | ✅ | ❌ (403) |

**Cara uji "server menolak" walau UI disembunyikan**: buka DevTools console pada
akun USER, panggil langsung server action (mis. lewat Network tab replay) —
harus tetap mendapat error permission, bukan hanya disembunyikan di UI.

## 3. CRUD & RLS

| Skenario | Langkah | Hasil yang diharapkan |
|---|---|---|
| USER membaca pekerjaan sendiri | Login USER, buka `/pekerjaan` | Hanya melihat pekerjaan yang ditugaskan/di-assign |
| USER mencoba akses `/pekerjaan/[id]` milik user lain via URL langsung | Salin ID pekerjaan user lain | Supabase mengembalikan data kosong (RLS block) → halaman 404 |
| ADMIN membuat pekerjaan | Isi form lengkap, submit | Data tersimpan, notifikasi terkirim ke penanggung jawab, audit log `CREATE_WORK` |
| Hapus unit yang punya pekerjaan aktif | Coba hapus/nonaktifkan | Sebaiknya nonaktifkan dulu pekerjaan terkait — FK `on delete set null` mencegah error tapi review data konsistensi secara berkala |

## 4. Upload Dokumen

| Skenario | Hasil yang diharapkan |
|---|---|
| Upload PDF < 10MB | Berhasil, muncul di daftar dokumen, audit log `UPLOAD_DOCUMENT` |
| Upload file `.exe` | Ditolak dengan pesan "Tipe file tidak diizinkan" |
| Upload file > 10MB | Ditolak dengan pesan "Ukuran file maksimal 10MB" |
| Download dokumen | Signed URL berhasil dibuka, kedaluwarsa setelah 60 detik |
| USER mencoba akses dokumen pekerjaan yang bukan miliknya | RLS `work_documents_select` menolak → 404 |

## 5. Menjalankan validasi otomatis

```bash
npm install
npm run lint        # ESLint
npx tsc --noEmit    # TypeScript check
npm run build       # Production build
```

Ketiganya harus **tanpa error** sebelum deploy (lihat `docs/deployment.md`).

## 6. (Opsional) Menambahkan test otomatis

Jika ingin menambah automated testing:
- **Vitest** untuk unit test `lib/permissions`, `lib/utils/deadline.ts` (logic murni,
  tidak bergantung Supabase — cocok untuk unit test cepat).
- **Playwright** untuk end-to-end test login/RBAC memakai project Supabase staging
  terpisah dari production.
