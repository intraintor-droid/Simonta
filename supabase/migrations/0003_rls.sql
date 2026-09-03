-- SIMONTA — Migration 0003: Row Level Security
-- WAJIB dijalankan. Semua tabel data mengaktifkan RLS, tidak ada policy `using (true)`
-- untuk tabel sensitif.

alter table profiles enable row level security;
alter table units enable row level security;
alter table work_categories enable row level security;
alter table works enable row level security;
alter table work_assignees enable row level security;
alter table work_updates enable row level security;
alter table work_documents enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;

-- ============ PROFILES ============
-- Semua user yang login boleh melihat profile lain sebatas untuk keperluan penugasan
-- (nama, unit, jabatan) — TIDAK termasuk kolom sensitif seperti NIP; pembatasan kolom
-- dilakukan di layer aplikasi/select, RLS di sini mengatur baris.
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles
  for select
  using (auth.uid() is not null);

drop policy if exists profiles_update_self on profiles;
create policy profiles_update_self on profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from profiles p where p.id = auth.uid()));
  -- user tidak bisa menaikkan role sendiri lewat update biasa

drop policy if exists profiles_superadmin_all on profiles;
create policy profiles_superadmin_all on profiles
  for all
  using (get_current_user_role() = 'SUPERADMIN')
  with check (get_current_user_role() = 'SUPERADMIN');

-- ============ UNITS ============
drop policy if exists units_select on units;
create policy units_select on units
  for select
  using (auth.uid() is not null);

drop policy if exists units_write_superadmin on units;
create policy units_write_superadmin on units
  for insert
  with check (get_current_user_role() = 'SUPERADMIN');

drop policy if exists units_update_superadmin on units;
create policy units_update_superadmin on units
  for update
  using (get_current_user_role() = 'SUPERADMIN')
  with check (get_current_user_role() = 'SUPERADMIN');

drop policy if exists units_delete_superadmin on units;
create policy units_delete_superadmin on units
  for delete
  using (get_current_user_role() = 'SUPERADMIN');

-- ============ WORK CATEGORIES ============
drop policy if exists categories_select on work_categories;
create policy categories_select on work_categories
  for select
  using (auth.uid() is not null);

drop policy if exists categories_write_superadmin on work_categories;
create policy categories_write_superadmin on work_categories
  for insert
  with check (get_current_user_role() = 'SUPERADMIN');

drop policy if exists categories_update_superadmin on work_categories;
create policy categories_update_superadmin on work_categories
  for update
  using (get_current_user_role() = 'SUPERADMIN')
  with check (get_current_user_role() = 'SUPERADMIN');

drop policy if exists categories_delete_superadmin on work_categories;
create policy categories_delete_superadmin on work_categories
  for delete
  using (get_current_user_role() = 'SUPERADMIN');

-- ============ WORKS ============
-- SUPERADMIN & ADMIN: lihat semua. USER: hanya pekerjaan yang ia jadi penanggung
-- jawab ATAU salah satu pelaksana.
drop policy if exists works_select on works;
create policy works_select on works
  for select
  using (
    get_current_user_role() in ('SUPERADMIN', 'ADMIN')
    or responsible_user_id = auth.uid()
    or exists (
      select 1 from work_assignees wa
      where wa.work_id = works.id and wa.user_id = auth.uid()
    )
  );

drop policy if exists works_insert on works;
create policy works_insert on works
  for insert
  with check (get_current_user_role() in ('SUPERADMIN', 'ADMIN'));

-- USER hanya boleh update kolom status/progress/notes pada pekerjaan miliknya;
-- pembatasan kolom yang lebih granular dilakukan di route handler (server),
-- RLS di sini memastikan baris yang boleh disentuh tetap terbatas.
drop policy if exists works_update on works;
create policy works_update on works
  for update
  using (
    get_current_user_role() in ('SUPERADMIN', 'ADMIN')
    or responsible_user_id = auth.uid()
    or exists (
      select 1 from work_assignees wa
      where wa.work_id = works.id and wa.user_id = auth.uid()
    )
  )
  with check (
    get_current_user_role() in ('SUPERADMIN', 'ADMIN')
    or responsible_user_id = auth.uid()
    or exists (
      select 1 from work_assignees wa
      where wa.work_id = works.id and wa.user_id = auth.uid()
    )
  );

drop policy if exists works_delete on works;
create policy works_delete on works
  for delete
  using (get_current_user_role() = 'SUPERADMIN');

-- ============ WORK ASSIGNEES ============
drop policy if exists work_assignees_select on work_assignees;
create policy work_assignees_select on work_assignees
  for select
  using (
    get_current_user_role() in ('SUPERADMIN', 'ADMIN')
    or is_work_member(work_id)
  );

drop policy if exists work_assignees_write on work_assignees;
create policy work_assignees_write on work_assignees
  for insert
  with check (get_current_user_role() in ('SUPERADMIN', 'ADMIN'));

drop policy if exists work_assignees_delete on work_assignees;
create policy work_assignees_delete on work_assignees
  for delete
  using (get_current_user_role() in ('SUPERADMIN', 'ADMIN'));

-- ============ WORK UPDATES (history, append-only) ============
drop policy if exists work_updates_select on work_updates;
create policy work_updates_select on work_updates
  for select
  using (
    get_current_user_role() in ('SUPERADMIN', 'ADMIN')
    or is_work_member(work_id)
  );

drop policy if exists work_updates_insert on work_updates;
create policy work_updates_insert on work_updates
  for insert
  with check (
    get_current_user_role() in ('SUPERADMIN', 'ADMIN')
    or is_work_member(work_id)
  );

-- Tidak ada policy UPDATE/DELETE untuk work_updates → history tidak bisa diubah/dihapus siapa pun.

-- ============ WORK DOCUMENTS ============
drop policy if exists work_documents_select on work_documents;
create policy work_documents_select on work_documents
  for select
  using (
    get_current_user_role() in ('SUPERADMIN', 'ADMIN')
    or is_work_member(work_id)
  );

drop policy if exists work_documents_insert on work_documents;
create policy work_documents_insert on work_documents
  for insert
  with check (
    get_current_user_role() in ('SUPERADMIN', 'ADMIN')
    or is_work_member(work_id)
  );

drop policy if exists work_documents_delete on work_documents;
create policy work_documents_delete on work_documents
  for delete
  using (
    get_current_user_role() = 'SUPERADMIN'
    or (get_current_user_role() = 'ADMIN')
    or uploaded_by = auth.uid()
  );

-- ============ NOTIFICATIONS ============
-- Setiap user hanya boleh melihat & mengubah (mark-as-read) notifikasi miliknya.
drop policy if exists notifications_select on notifications;
create policy notifications_select on notifications
  for select
  using (user_id = auth.uid());

drop policy if exists notifications_update_self on notifications;
create policy notifications_update_self on notifications
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists notifications_insert on notifications;
create policy notifications_insert on notifications
  for insert
  with check (get_current_user_role() in ('SUPERADMIN', 'ADMIN') or user_id = auth.uid());

-- ============ AUDIT LOGS ============
-- Hanya SUPERADMIN & ADMIN yang dapat melihat. Tidak ada policy UPDATE/DELETE sama sekali
-- untuk siapa pun (termasuk ADMIN) → audit log tidak dapat diubah/dihapus.
drop policy if exists audit_logs_select on audit_logs;
create policy audit_logs_select on audit_logs
  for select
  using (get_current_user_role() in ('SUPERADMIN', 'ADMIN'));

drop policy if exists audit_logs_insert on audit_logs;
create policy audit_logs_insert on audit_logs
  for insert
  with check (auth.uid() is not null);
