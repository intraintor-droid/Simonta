-- SIMONTA — Migration 0004: Storage bucket & policies
-- Bucket dibuat PRIVATE (tidak public) — akses hanya lewat signed URL yang di-generate
-- server setelah lolos pengecekan RBAC & RLS.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'work-documents',
  'work-documents',
  false,
  10485760, -- 10MB
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png'
  ]
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Path convention: work-documents/{work_id}/{uuid}-{filename}
-- Policy storage.objects: hanya anggota pekerjaan (responsible/assignee) atau ADMIN/SUPERADMIN
-- yang boleh baca/tulis file dalam folder work_id tersebut.

drop policy if exists work_documents_storage_select on storage.objects;
create policy work_documents_storage_select on storage.objects
  for select
  using (
    bucket_id = 'work-documents'
    and (
      get_current_user_role() in ('SUPERADMIN', 'ADMIN')
      or is_work_member(( (storage.foldername(name))[1] )::uuid)
    )
  );

drop policy if exists work_documents_storage_insert on storage.objects;
create policy work_documents_storage_insert on storage.objects
  for insert
  with check (
    bucket_id = 'work-documents'
    and (
      get_current_user_role() in ('SUPERADMIN', 'ADMIN')
      or is_work_member(( (storage.foldername(name))[1] )::uuid)
    )
  );

drop policy if exists work_documents_storage_delete on storage.objects;
create policy work_documents_storage_delete on storage.objects
  for delete
  using (
    bucket_id = 'work-documents'
    and (
      get_current_user_role() in ('SUPERADMIN', 'ADMIN')
      or owner = auth.uid()
    )
  );
