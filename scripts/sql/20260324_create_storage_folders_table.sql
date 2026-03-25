begin;

create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  website_id uuid not null references public.cms_websites(id) on delete cascade,
  parent_folder_id uuid references public.folders(id) on delete set null,
  name text not null,
  slug text not null,
  full_path text not null,
  created_by uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint folders_name_not_empty check (char_length(btrim(name)) > 0),
  constraint folders_name_max_length check (char_length(name) <= 50),
  constraint folders_slug_not_empty check (char_length(btrim(slug)) > 0),
  constraint folders_full_path_not_empty check (char_length(btrim(full_path)) > 0)
);

create index if not exists folders_tenant_website_idx
  on public.folders (tenant_id, website_id);

create index if not exists folders_parent_folder_idx
  on public.folders (parent_folder_id);

create index if not exists folders_created_by_idx
  on public.folders (created_by);

create index if not exists folders_created_at_idx
  on public.folders (created_at desc);

create unique index if not exists folders_website_full_path_unique_idx
  on public.folders (website_id, full_path)
  where deleted_at is null;

create unique index if not exists folders_parent_slug_unique_idx
  on public.folders (website_id, parent_folder_id, slug)
  where deleted_at is null;

alter table public.files
  add column if not exists folder_id uuid references public.folders(id) on delete set null;

create index if not exists files_folder_id_idx
  on public.files (folder_id);

commit;
