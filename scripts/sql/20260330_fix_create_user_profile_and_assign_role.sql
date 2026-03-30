begin;

create or replace function public.create_user_profile_and_assign_role(
  p_user_id uuid,
  p_email text,
  p_first_name text,
  p_last_name text,
  p_role_type_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Invite creation failed: no authenticated user found.';
  end if;

  if not public.has_global_role(auth.uid(), 'system_admin') then
    raise exception 'Invite creation failed: only system administrators can create invited users.';
  end if;

  if p_user_id is null then
    raise exception 'Invite creation failed: user ID is required.';
  end if;

  if p_email is null or btrim(p_email) = '' then
    raise exception 'Invite creation failed: email is required.';
  end if;

  if p_role_type_id is null then
    raise exception 'Invite creation failed: global role type ID is required.';
  end if;

  insert into public.users (
    id,
    email,
    first_name,
    last_name
  )
  values (
    p_user_id,
    p_email,
    nullif(btrim(p_first_name), ''),
    nullif(btrim(p_last_name), '')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    updated_at = now();

  if not exists (
    select 1
    from public.user_global_roles ugr
    where ugr.user_id = p_user_id
      and ugr.global_role_type_id = p_role_type_id
  ) then
    insert into public.user_global_roles (
      user_id,
      global_role_type_id
    )
    values (
      p_user_id,
      p_role_type_id
    );
  end if;

  return true;
end;
$$;

commit;
