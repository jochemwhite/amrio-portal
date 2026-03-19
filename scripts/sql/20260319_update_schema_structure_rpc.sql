-- Atomic schema structure update RPC.
-- Keeps all schema/section/field mutations in one database transaction.

begin;

create or replace function public.update_schema_structure_tx(
  schema_id_param uuid,
  tenant_id_param uuid,
  payload_param jsonb
)
returns void
language plpgsql
as $function$
declare
  schema_exists boolean;
  schema_name text;
  schema_description text;
  schema_template boolean;
begin
  select exists (
    select 1
    from public.cms_schemas s
    where s.id = schema_id_param
      and s.tenant_id = tenant_id_param
  )
  into schema_exists;

  if not schema_exists then
    raise exception 'Schema not found or access denied.';
  end if;

  schema_name := trim(coalesce(payload_param -> 'schema' ->> 'name', ''));
  if schema_name = '' then
    raise exception 'Schema name is required.';
  end if;

  schema_description := payload_param -> 'schema' ->> 'description';
  schema_template := coalesce((payload_param -> 'schema' ->> 'template')::boolean, false);

  update public.cms_schemas
  set
    name = schema_name,
    description = schema_description,
    template = schema_template
  where id = schema_id_param
    and tenant_id = tenant_id_param;

  -- Guard against IDs that belong to another schema.
  if exists (
    with submitted_sections as (
      select (value ->> 'id')::uuid as id
      from jsonb_array_elements(coalesce(payload_param -> 'sections', '[]'::jsonb))
    )
    select 1
    from submitted_sections ss
    join public.cms_schema_sections s on s.id = ss.id
    where s.schema_id <> schema_id_param
  ) then
    raise exception 'One or more section IDs belong to a different schema.';
  end if;

  if exists (
    with submitted_fields as (
      select (value ->> 'id')::uuid as id
      from jsonb_array_elements(coalesce(payload_param -> 'fields', '[]'::jsonb))
    )
    select 1
    from submitted_fields sf
    join public.cms_schema_fields f on f.id = sf.id
    join public.cms_schema_sections s on s.id = f.schema_section_id
    where s.schema_id <> schema_id_param
  ) then
    raise exception 'One or more field IDs belong to a different schema.';
  end if;

  -- Delete removed fields first (single statement handles parent/child dependency set).
  delete from public.cms_schema_fields f
  where f.schema_section_id in (
    select s.id
    from public.cms_schema_sections s
    where s.schema_id = schema_id_param
  )
  and not exists (
    select 1
    from jsonb_array_elements(coalesce(payload_param -> 'fields', '[]'::jsonb)) fld
    where (fld ->> 'id')::uuid = f.id
  );

  -- Upsert sections.
  with payload_sections as (
    select
      (value ->> 'id')::uuid as id,
      (value ->> 'order')::integer as order_num,
      value ->> 'name' as name,
      value ->> 'description' as description
    from jsonb_array_elements(coalesce(payload_param -> 'sections', '[]'::jsonb))
  )
  update public.cms_schema_sections s
  set
    "order" = ps.order_num,
    name = ps.name,
    description = ps.description
  from payload_sections ps
  where s.id = ps.id
    and s.schema_id = schema_id_param;

  with payload_sections as (
    select
      (value ->> 'id')::uuid as id,
      (value ->> 'order')::integer as order_num,
      value ->> 'name' as name,
      value ->> 'description' as description
    from jsonb_array_elements(coalesce(payload_param -> 'sections', '[]'::jsonb))
  )
  insert into public.cms_schema_sections (
    id,
    schema_id,
    "order",
    name,
    description
  )
  select
    ps.id,
    schema_id_param,
    ps.order_num,
    ps.name,
    ps.description
  from payload_sections ps
  where not exists (
    select 1
    from public.cms_schema_sections s
    where s.id = ps.id
  );

  -- Upsert fields.
  with payload_fields as (
    select
      (value ->> 'id')::uuid as id,
      (value ->> 'order')::integer as order_num,
      (value ->> 'schemaSectionId')::uuid as schema_section_id,
      nullif(value ->> 'parentFieldId', '')::uuid as parent_field_id,
      value ->> 'name' as name,
      value ->> 'fieldKey' as field_key,
      (value ->> 'type')::public.field_type as type,
      coalesce((value ->> 'required')::boolean, false) as required,
      value ->> 'defaultValue' as default_value,
      value ->> 'validation' as validation,
      value -> 'settings' as settings,
      nullif(value ->> 'collectionId', '')::uuid as collection_id
    from jsonb_array_elements(coalesce(payload_param -> 'fields', '[]'::jsonb))
  )
  update public.cms_schema_fields f
  set
    name = pf.name,
    field_key = pf.field_key,
    type = pf.type,
    required = pf.required,
    default_value = pf.default_value,
    validation = pf.validation,
    settings = pf.settings,
    collection_id = pf.collection_id,
    "order" = pf.order_num,
    parent_field_id = pf.parent_field_id,
    schema_section_id = pf.schema_section_id
  from payload_fields pf
  join public.cms_schema_sections s on s.id = pf.schema_section_id
  where f.id = pf.id
    and s.schema_id = schema_id_param;

  with payload_fields as (
    select
      (value ->> 'id')::uuid as id,
      (value ->> 'order')::integer as order_num,
      (value ->> 'schemaSectionId')::uuid as schema_section_id,
      nullif(value ->> 'parentFieldId', '')::uuid as parent_field_id,
      value ->> 'name' as name,
      value ->> 'fieldKey' as field_key,
      (value ->> 'type')::public.field_type as type,
      coalesce((value ->> 'required')::boolean, false) as required,
      value ->> 'defaultValue' as default_value,
      value ->> 'validation' as validation,
      value -> 'settings' as settings,
      nullif(value ->> 'collectionId', '')::uuid as collection_id
    from jsonb_array_elements(coalesce(payload_param -> 'fields', '[]'::jsonb))
  )
  insert into public.cms_schema_fields (
    id,
    name,
    field_key,
    type,
    required,
    default_value,
    validation,
    settings,
    collection_id,
    "order",
    parent_field_id,
    schema_section_id
  )
  select
    pf.id,
    pf.name,
    pf.field_key,
    pf.type,
    pf.required,
    pf.default_value,
    pf.validation,
    pf.settings,
    pf.collection_id,
    pf.order_num,
    pf.parent_field_id,
    pf.schema_section_id
  from payload_fields pf
  join public.cms_schema_sections s on s.id = pf.schema_section_id
  where s.schema_id = schema_id_param
    and not exists (
      select 1
      from public.cms_schema_fields f
      where f.id = pf.id
    );

  -- Delete removed sections last.
  delete from public.cms_schema_sections s
  where s.schema_id = schema_id_param
    and not exists (
      select 1
      from jsonb_array_elements(coalesce(payload_param -> 'sections', '[]'::jsonb)) sec
      where (sec ->> 'id')::uuid = s.id
    );
end;
$function$;

commit;
