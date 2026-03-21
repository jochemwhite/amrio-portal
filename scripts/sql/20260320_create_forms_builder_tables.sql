-- Forms builder core tables for headless CMS usage.
-- Mirrors fs-form-builder concepts, adapted to tenant + website boundaries.

begin;

create table if not exists public.cms_forms (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  website_id uuid not null references public.cms_websites(id) on delete cascade,
  created_by uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  description text,
  content jsonb not null default '[]'::jsonb,
  published boolean not null default false,
  share_url text not null unique default gen_random_uuid()::text,
  visits integer not null default 0,
  submissions integer not null default 0,
  archived_at timestamptz
);

create table if not exists public.cms_form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.cms_forms(id) on delete cascade,
  created_at timestamptz not null default now(),
  content jsonb not null,
  metadata jsonb
);

create unique index if not exists cms_forms_website_name_unique_idx
  on public.cms_forms (website_id, lower(name));

create index if not exists cms_forms_tenant_website_idx
  on public.cms_forms (tenant_id, website_id);

create index if not exists cms_forms_created_by_idx
  on public.cms_forms (created_by);

create index if not exists cms_forms_created_at_idx
  on public.cms_forms (created_at desc);

create index if not exists cms_form_submissions_form_id_idx
  on public.cms_form_submissions (form_id);

create index if not exists cms_form_submissions_created_at_idx
  on public.cms_form_submissions (created_at desc);

create or replace function public.set_cms_forms_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_cms_forms_updated_at on public.cms_forms;

create trigger trg_cms_forms_updated_at
before update on public.cms_forms
for each row
execute function public.set_cms_forms_updated_at();

commit;
