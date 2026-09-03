# RBAC — Permission Matrix SIMONTA

Permission diperiksa di **tiga lapisan**: Frontend (UX), Server (route handler), dan
Database (RLS). Sumber kebenaran tunggal ada di `lib/permissions/index.ts` (untuk
server/frontend) dan `supabase/migrations/0003_rls.sql` (untuk database).

| Modul | SUPERADMIN | ADMIN | USER |
|---|---|---|---|
| Dashboard | Full (+ statistik global) | Lihat semua pekerjaan | Lihat pekerjaan sendiri |
| Pekerjaan – Create | ✅ | ✅ | ❌ |
| Pekerjaan – Read | Semua | Semua | Hanya ditugaskan ke dirinya |
| Pekerjaan – Update (data master) | ✅ | ✅ | ❌ |
| Pekerjaan – Update progress/status/catatan | ✅ | ✅ | ✅ (hanya miliknya) |
| Pekerjaan – Delete | ✅ | ❌ | ❌ |
| Upload dokumen | ✅ | ✅ | ✅ (pada pekerjaan miliknya) |
| User Management | ✅ | ❌ (read-only untuk user terkait pekerjaan) | ❌ |
| Ubah role user | ✅ | ❌ | ❌ |
| Hapus SUPERADMIN | ❌ (tidak diizinkan sistem) | ❌ | ❌ |
| Master Unit / Kategori | ✅ | ❌ (read-only) | ❌ (read-only) |
| Audit Log | ✅ (read-only, tidak bisa hapus) | ✅ (read-only, tidak bisa hapus) | ❌ |
| Laporan & Export | ✅ | ✅ | ❌ (halaman tidak dapat diakses) |
| Kalender | ✅ | ✅ | ✅ (event sesuai scope) |
| Pengaturan keamanan | ✅ | ❌ | ❌ |

## Aturan khusus
- ADMIN **tidak dapat** menghapus atau mengubah role akun SUPERADMIN — diberlakukan di
  `lib/permissions` dan RLS `profiles_superadmin_all`.
- Tidak ada **hard delete** untuk `profiles` yang punya histori pekerjaan — gunakan
  `is_active = false` (nonaktifkan).
- `audit_logs` tidak memiliki policy UPDATE/DELETE sama sekali → tidak bisa dihapus oleh
  siapa pun lewat aplikasi.

## Route protection (`middleware.ts`)
| Path prefix | Role yang diizinkan |
|---|---|
| `/dashboard/*` | Semua user terautentikasi |
| `/pekerjaan/*` | Semua user terautentikasi (baris dibatasi RLS) |
| `/users/*` | SUPERADMIN |
| `/master/*` | SUPERADMIN (write), semua (read) |
| `/audit-log/*` | SUPERADMIN, ADMIN |
| `/laporan/*` | SUPERADMIN, ADMIN |
| `/pengaturan/*` | SUPERADMIN |

Akses ditolak → redirect ke halaman `403`.
