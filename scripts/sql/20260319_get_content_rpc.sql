-- Unified content reader for pages, collection entries, and layout entries.
-- Usage:
--   select public.get_content('page', '<page_uuid>');
--   select public.get_content('collection_entry', '<entry_uuid>');
--   select public.get_content('layout_entry', '<layout_entry_uuid>');

begin;

create or replace function public.build_schema_fields_with_content_section(
  schema_section_id_param uuid,
  content_section_id_param uuid,
  parent_field_id_param uuid default null
)
returns jsonb
language plpgsql
stable
set search_path = public
as $function$
declare
  result jsonb;
begin
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', sf.id,
        'name', sf.name,
        'description', '',
        'type', sf.type,
        'order', coalesce(sf."order", 0),
        'required', sf.required,
        'created_at', sf.created_at,
        'updated_at', sf.updated_at,
        'validation', coalesce(sf.validation, ''),
        'default_value', coalesce(sf.default_value, ''),
        'parent_field_id', sf.parent_field_id,
        'collection_id', sf.collection_id,
        'settings', sf.settings,
        'content', case when cf.id is null then null else jsonb_build_object('value', cf.content) end,
        'content_field_id', cf.id,
        'fields', case
          when sf.type = 'section' then public.build_schema_fields_with_content_section(
            schema_section_id_param,
            content_section_id_param,
            sf.id
          )
          else '[]'::jsonb
        end
      )
      order by coalesce(sf."order", 0)
    ),
    '[]'::jsonb
  )
  into result
  from public.cms_schema_fields sf
  left join public.cms_content_fields cf
    on cf.schema_field_id = sf.id
   and cf.section_id = content_section_id_param
  where sf.schema_section_id = schema_section_id_param
    and sf.parent_field_id is not distinct from parent_field_id_param;

  return result;
end;
$function$;

create or replace function public.get_content(
  entity_type_param text,
  entity_id_param uuid,
  tenant_id_param uuid default null,
  create_missing_sections_param boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  entity_type_normalized text := lower(entity_type_param);
  schema_id_value uuid;
  tenant_id_value uuid;
  schema_name_value text;
  schema_description_value text;
  schema_template_value boolean;
  result_payload jsonb;
  sections_payload jsonb := '[]'::jsonb;
  section_record record;
  content_section_id_value uuid;
begin
  if entity_type_normalized not in ('page', 'collection_entry', 'layout_entry') then
    raise exception 'Unsupported entity type: %', entity_type_param;
  end if;

  if entity_type_normalized = 'page' then
    select
      p.schema_id,
      w.tenant_id,
      s.name,
      s.description,
      s.template,
      jsonb_build_object(
        'entity_type', 'page',
        'id', p.id,
        'name', p.name,
        'slug', p.slug,
        'description', p.description,
        'status', p.status,
        'website_id', p.website_id,
        'created_at', p.created_at,
        'updated_at', p.updated_at
      )
    into
      schema_id_value,
      tenant_id_value,
      schema_name_value,
      schema_description_value,
      schema_template_value,
      result_payload
    from public.cms_pages p
    left join public.cms_schemas s on s.id = p.schema_id
    left join public.cms_websites w on w.id = p.website_id
    where p.id = entity_id_param;
  elsif entity_type_normalized = 'collection_entry' then
    select
      c.schema_id,
      w.tenant_id,
      s.name,
      s.description,
      s.template,
      jsonb_build_object(
        'entity_type', 'collection_entry',
        'id', e.id,
        'name', e.name,
        'created_at', e.created_at,
        'collection_id', c.id,
        'collection_name', c.name,
        'collection_description', c.description
      )
    into
      schema_id_value,
      tenant_id_value,
      schema_name_value,
      schema_description_value,
      schema_template_value,
      result_payload
    from public.cms_collection_entries e
    join public.cms_collections c on c.id = e.collection_id
    left join public.cms_schemas s on s.id = c.schema_id
    left join public.cms_websites w on w.id = c.website_id
    where e.id = entity_id_param;
  else
    select
      l.schema_id,
      w.tenant_id,
      s.name,
      s.description,
      s.template,
      jsonb_build_object(
        'entity_type', 'layout_entry',
        'id', le.id,
        'name', coalesce(le.name, l.name),
        'created_at', le.created_at,
        'layout_id', l.id,
        'layout_name', l.name,
        'layout_description', l.description,
        'layout_entry_type', le.type,
        'is_default', le.is_default,
        'website_id', l.website_id
      )
    into
      schema_id_value,
      tenant_id_value,
      schema_name_value,
      schema_description_value,
      schema_template_value,
      result_payload
    from public.cms_layout_entries le
    join public.cms_layouts l on l.id = le.layout_id
    left join public.cms_schemas s on s.id = l.schema_id
    left join public.cms_websites w on w.id = l.website_id
    where le.id = entity_id_param;
  end if;

  if result_payload is null then
    return null;
  end if;

  if tenant_id_param is not null and tenant_id_value is distinct from tenant_id_param then
    raise exception 'Access denied for tenant %', tenant_id_param;
  end if;

  if schema_id_value is null then
    return result_payload
      || jsonb_build_object(
        'schema_id', null,
        'schema_name', null,
        'schema_description', null,
        'schema_template', null,
        'sections', '[]'::jsonb
      );
  end if;

  for section_record in
    select
      ss.id,
      ss.name,
      ss.description,
      coalesce(ss."order", 0) as order_num
    from public.cms_schema_sections ss
    where ss.schema_id = schema_id_value
    order by coalesce(ss."order", 0)
  loop
    content_section_id_value := null;

    if entity_type_normalized = 'page' then
      select cs.id
      into content_section_id_value
      from public.cms_content_sections cs
      where cs.page_id = entity_id_param
        and cs.schema_section_id = section_record.id
      limit 1;

      if content_section_id_value is null and create_missing_sections_param then
        insert into public.cms_content_sections (
          page_id,
          schema_section_id,
          name,
          description,
          "order"
        )
        values (
          entity_id_param,
          section_record.id,
          section_record.name,
          section_record.description,
          section_record.order_num
        )
        returning id into content_section_id_value;
      end if;
    elsif entity_type_normalized = 'collection_entry' then
      select cs.id
      into content_section_id_value
      from public.cms_content_sections cs
      where cs.cms_collection_entry_id = entity_id_param
        and cs.schema_section_id = section_record.id
      limit 1;

      if content_section_id_value is null and create_missing_sections_param then
        insert into public.cms_content_sections (
          cms_collection_entry_id,
          schema_section_id,
          name,
          description,
          "order"
        )
        values (
          entity_id_param,
          section_record.id,
          section_record.name,
          section_record.description,
          section_record.order_num
        )
        returning id into content_section_id_value;
      end if;
    else
      select cs.id
      into content_section_id_value
      from public.cms_content_sections cs
      where cs.layout_entry_id = entity_id_param
        and cs.schema_section_id = section_record.id
      limit 1;

      if content_section_id_value is null and create_missing_sections_param then
        insert into public.cms_content_sections (
          layout_entry_id,
          schema_section_id,
          name,
          description,
          "order"
        )
        values (
          entity_id_param,
          section_record.id,
          section_record.name,
          section_record.description,
          section_record.order_num
        )
        returning id into content_section_id_value;
      end if;
    end if;

    sections_payload := sections_payload || jsonb_build_array(
      jsonb_build_object(
        'id', section_record.id,
        'name', section_record.name,
        'order', section_record.order_num,
        'fields', case
          when content_section_id_value is null then '[]'::jsonb
          else public.build_schema_fields_with_content_section(
            section_record.id,
            content_section_id_value,
            null
          )
        end,
        'page_id', entity_id_param,
        'created_at', null,
        'updated_at', null,
        'description', coalesce(section_record.description, '')
      )
    );
  end loop;

  return result_payload || jsonb_build_object(
    'schema_id', schema_id_value,
    'schema_name', schema_name_value,
    'schema_description', schema_description_value,
    'schema_template', schema_template_value,
    'sections', sections_payload
  );
end;
$function$;

grant execute on function public.get_content(text, uuid, uuid, boolean) to authenticated, service_role;
grant execute on function public.build_schema_fields_with_content_section(uuid, uuid, uuid) to authenticated, service_role;

commit;
