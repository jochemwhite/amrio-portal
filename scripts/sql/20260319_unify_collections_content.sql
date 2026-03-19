-- Unify collection content storage into shared cms_content_sections + cms_content_fields.
-- This migration intentionally drops cms_collections_items data.

begin;

-- 1) Add a dedicated collection-entry owner column on sections.
alter table public.cms_content_sections
  add column if not exists cms_collection_entry_id uuid;

-- 2) Add FK for collection-entry owner.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'cms_content_sections_cms_collection_entry_id_fkey'
      and conrelid = 'public.cms_content_sections'::regclass
  ) then
    alter table public.cms_content_sections
      add constraint cms_content_sections_cms_collection_entry_id_fkey
      foreign key (cms_collection_entry_id)
      references public.cms_collection_entries(id)
      on delete cascade;
  end if;
end
$$;

-- 3) Add/ensure field->section FK to keep section/field integrity.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'cms_content_fields_section_id_fkey'
      and conrelid = 'public.cms_content_fields'::regclass
  ) then
    alter table public.cms_content_fields
      add constraint cms_content_fields_section_id_fkey
      foreign key (section_id)
      references public.cms_content_sections(id)
      on delete cascade;
  end if;
end
$$;

-- 4) Ensure at most one content row per (section, schema field).
create unique index if not exists cms_content_fields_section_schema_unique_idx
  on public.cms_content_fields(section_id, schema_field_id);

-- 5) Helpful indexes for collection reads.
create index if not exists cms_content_sections_collection_entry_idx
  on public.cms_content_sections(cms_collection_entry_id);

create index if not exists cms_content_sections_page_id_idx
  on public.cms_content_sections(page_id);

create index if not exists cms_content_fields_section_id_idx
  on public.cms_content_fields(section_id);

-- 6) Move any already-created collection-linked sections from page_id to cms_collection_entry_id.


-- 7) Remove legacy collection table.
drop table if exists public.cms_collections_items cascade;

commit;
