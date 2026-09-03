# Database — SIMONTA

Lihat SQL lengkap di `supabase/migrations/`. Ringkasan tabel:

| Tabel | Fungsi |
|---|---|
| `profiles` | Data user, 1:1 dengan `auth.users`, menyimpan `role` |
| `units` | Master satuan kerja |
| `work_categories` | Master kategori pekerjaan |
| `works` | Data pekerjaan utama (status, progress, deadline) |
| `work_assignees` | Pelaksana tambahan (many-to-many) |
| `work_updates` | History perubahan progress/status (append-only) |
| `work_documents` | Metadata dokumen, file fisik di Storage bucket `work-documents` |
| `notifications` | Notifikasi per user |
| `audit_logs` | Log aktivitas (append-only, tidak bisa diubah/dihapus) |

## Enum
- `user_role`: `SUPERADMIN`, `ADMIN`, `USER`
- `work_status`: `BELUM_DIMULAI`, `BERJALAN`, `MENUNGGU`, `SELESAI`, `TERLAMBAT`, `DIBATALKAN`
- `work_priority`: `RENDAH`, `SEDANG`, `TINGGI`, `MENDESAK`

## Menjalankan migration
```bash
# via Supabase CLI
supabase link --project-ref <project-ref>
supabase db push

# atau tempel isi file secara berurutan (0001 → 0004) di SQL Editor dashboard
```

## Kenapa `work_updates` append-only?
Supaya history progress pekerjaan tidak bisa dimanipulasi setelah dicatat — tidak ada
RLS policy UPDATE/DELETE untuk tabel ini sama sekali (lihat `0003_rls.sql`).
