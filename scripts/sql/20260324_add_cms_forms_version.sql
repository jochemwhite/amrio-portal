begin;

alter table public.cms_forms
  add column if not exists version integer not null default 1;

create index if not exists cms_form_submissions_form_id_idx
  on public.cms_form_submissions (form_id);

create or replace function public.set_cms_forms_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  new.version = coalesce(old.version, 1) + 1;
  return new;
end;
$$;

drop trigger if exists trg_cms_forms_updated_at on public.cms_forms;

create trigger trg_cms_forms_updated_at
before update on public.cms_forms
for each row
execute function public.set_cms_forms_updated_at();

commit;
