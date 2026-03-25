begin;

create or replace function public.increment_storage_used(
  p_tenant_id uuid,
  p_bytes bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.tenants
  set
    storage_used_bytes = coalesce(storage_used_bytes, 0) + p_bytes,
    storage_quota_exceeded_at = case
      when storage_quota_bytes is not null
        and coalesce(storage_used_bytes, 0) + p_bytes > storage_quota_bytes
      then coalesce(storage_quota_exceeded_at, now())
      else null
    end,
    updated_at = now()
  where id = p_tenant_id;
end;
$$;

create or replace function public.decrement_storage_used(
  p_tenant_id uuid,
  p_bytes bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.tenants
  set
    storage_used_bytes = greatest(coalesce(storage_used_bytes, 0) - p_bytes, 0),
    storage_quota_exceeded_at = case
      when storage_quota_bytes is not null
        and greatest(coalesce(storage_used_bytes, 0) - p_bytes, 0) > storage_quota_bytes
      then coalesce(storage_quota_exceeded_at, now())
      else null
    end,
    updated_at = now()
  where id = p_tenant_id;
end;
$$;

commit;
