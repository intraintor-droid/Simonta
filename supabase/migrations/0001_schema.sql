-- SIMONTA — Migration 0001: Core schema
-- Jalankan berurutan di Supabase SQL Editor atau via `supabase db push`.

create extension if not exists "pgcrypto";

-- ============ ENUMS ============
do $$ begin
  create type user_role as enum ('SUPERADMIN', 'ADMIN', 'USER');
exception when duplicate_object then null; end $$;

do $$ begin
  create type work_status as enum (
    'BELUM_DIMULAI', 'BERJALAN', 'MENUNGGU', 'SELESAI', 'TERLAMBAT', 'DIBATALKAN'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type work_priority as enum ('RENDAH', 'SEDANG', 'TINGGI', 'MENDESAK');
exception when duplicate_object then null; end $$;

-- ============ UNITS ============
create table if not exists units (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  head_user_id uuid, -- FK ditambahkan setelah profiles dibuat
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ PROFILES ============
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  nip text unique,
  phone text,
  position text,
  unit_id uuid references units(id) on delete set null,
  role user_role not null default 'USER',
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table units
  add constraint units_head_user_fk foreign key (head_user_id)
  references profiles(id) on delete set null;

-- ============ WORK CATEGORIES ============
create table if not exists work_categories (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ WORKS ============
create table if not exists works (
  id uuid primary key default gen_random_uuid(),
  work_number text unique not null,
  title text not null,
  description text,
  category_id uuid references work_categories(id) on delete set null,
  unit_id uuid references units(id) on delete set null,
  responsible_user_id uuid references profiles(id) on delete set null,
  priority work_priority not null default 'SEDANG',
  status work_status not null default 'BELUM_DIMULAI',
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  start_date date,
  deadline date,
  completed_at timestamptz,
  notes text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ WORK ASSIGNEES (many-to-many pelaksana) ============
create table if not exists work_assignees (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references works(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  unique (work_id, user_id)
);

-- ============ WORK UPDATES (history, append-only) ============
create table if not exists work_updates (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references works(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  progress integer check (progress >= 0 and progress <= 100),
  status work_status,
  notes text,
  created_at timestamptz not null default now()
);

-- ============ WORK DOCUMENTS ============
create table if not exists work_documents (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references works(id) on delete cascade,
  uploaded_by uuid references profiles(id) on delete set null,
  file_name text not null,
  file_path text not null,
  file_type text,
  file_size bigint,
  created_at timestamptz not null default now()
);

-- ============ NOTIFICATIONS ============
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  message text,
  type text not null default 'INFO',
  related_work_id uuid references works(id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============ AUDIT LOGS (append-only, no delete/update allowed via RLS) ============
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  action text not null,
  module text not null,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

-- ============ INDEXES ============
create index if not exists idx_works_number on works(work_number);
create index if not exists idx_works_status on works(status);
create index if not exists idx_works_priority on works(priority);
create index if not exists idx_works_deadline on works(deadline);
create index if not exists idx_works_responsible on works(responsible_user_id);
create index if not exists idx_works_unit on works(unit_id);
create index if not exists idx_works_category on works(category_id);
create index if not exists idx_works_created_at on works(created_at);
create index if not exists idx_profiles_unit on profiles(unit_id);
create index if not exists idx_profiles_role on profiles(role);
create index if not exists idx_work_assignees_work on work_assignees(work_id);
create index if not exists idx_work_assignees_user on work_assignees(user_id);
create index if not exists idx_work_updates_work on work_updates(work_id);
create index if not exists idx_work_documents_work on work_documents(work_id);
create index if not exists idx_notifications_user on notifications(user_id, is_read);
create index if not exists idx_audit_logs_module on audit_logs(module, created_at);

-- ============ updated_at trigger helper ============
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_units_updated_at on units;
create trigger trg_units_updated_at before update on units
  for each row execute function set_updated_at();

drop trigger if exists trg_profiles_updated_at on profiles;
create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

drop trigger if exists trg_categories_updated_at on work_categories;
create trigger trg_categories_updated_at before update on work_categories
  for each row execute function set_updated_at();

drop trigger if exists trg_works_updated_at on works;
create trigger trg_works_updated_at before update on works
  for each row execute function set_updated_at();
