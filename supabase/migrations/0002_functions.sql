-- SIMONTA — Migration 0002: Helper functions

-- Ambil role user yang sedang login, dipakai di RLS policy.
-- SECURITY DEFINER supaya bisa membaca `profiles` walau RLS profiles membatasi baris,
-- tapi function ini HANYA mengembalikan role milik auth.uid() sendiri (tidak bisa dipakai
-- untuk membaca data user lain), jadi aman dipakai di dalam policy.
create or replace function get_current_user_role()
returns user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function is_active_user()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_active from profiles where id = auth.uid()), false);
$$;

-- Cek apakah auth.uid() adalah penanggung jawab atau salah satu pelaksana suatu work.
create or replace function is_work_member(p_work_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from works w
    where w.id = p_work_id and w.responsible_user_id = auth.uid()
  ) or exists (
    select 1 from work_assignees wa
    where wa.work_id = p_work_id and wa.user_id = auth.uid()
  );
$$;

-- Auto-create baris profiles saat ada user baru di auth.users (dibuat lewat Supabase Auth
-- Admin API / dashboard). Role default USER; SUPERADMIN menaikkan role via halaman /users.
create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'USER')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- Auto-set completed_at ketika status berubah menjadi SELESAI, dan catat history ke work_updates.
create or replace function handle_work_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'SELESAI' and old.status is distinct from 'SELESAI' then
    new.completed_at = now();
  elsif new.status is distinct from 'SELESAI' then
    new.completed_at = null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_work_status_change on works;
create trigger trg_work_status_change before update on works
  for each row execute function handle_work_status_change();
