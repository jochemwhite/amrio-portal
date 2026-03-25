begin;

alter table public.files
  add column if not exists folder_id uuid references public.folders(id) on delete set null,
  add column if not exists upload_status text,
  add column if not exists expires_at timestamptz;

update public.files
set upload_status = 'confirmed'
where upload_status is null;

alter table public.files
  alter column upload_status set default 'confirmed';

alter table public.files
  alter column upload_status set not null;

create index if not exists files_folder_id_idx
  on public.files (folder_id);

create index if not exists files_upload_status_idx
  on public.files (upload_status);

create index if not exists files_expires_at_idx
  on public.files (expires_at)
  where expires_at is not null;

commit;
