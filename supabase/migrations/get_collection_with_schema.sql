-- Function to get collection with full schema details in one RPC call
-- This combines getCollectionById and getSchemaById functionality

create or replace function public.get_collection_with_schema(
  p_collection_id uuid,
  p_tenant_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_result jsonb;
  v_collection jsonb;
  v_schema jsonb;
  v_schema_id uuid;
  v_tenant_id uuid;
begin
  -- Fetch the collection with tenant verification
  select 
    jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'description', c.description,
      'schema_id', c.schema_id,
      'website_id', c.website_id,
      'created_by', c.created_by,
      'created_at', c.created_at
    ),
    c.schema_id,
    w.tenant_id
  into v_collection, v_schema_id, v_tenant_id
  from public.cms_collections c
  inner join public.cms_websites w on w.id = c.website_id
  where c.id = p_collection_id;

  -- Check if collection exists
  if v_collection is null then
    raise exception 'Collection not found';
  end if;

  -- Check tenant access
  if v_tenant_id != p_tenant_id then
    raise exception 'Access denied: Collection does not belong to the specified tenant';
  end if;

  -- If no schema_id, return collection without schema
  if v_schema_id is null then
    return jsonb_build_object(
      'success', true,
      'data', v_collection
    );
  end if;

  -- Fetch the full schema with sections and fields
  select 
    jsonb_build_object(
      'id', s.id,
      'name', s.name,
      'description', s.description,
      'template', s.template,
      'created_by', s.created_by,
      'tenant_id', s.tenant_id,
      'created_at', s.created_at,
      'updated_at', s.updated_at,
      'cms_schema_sections', (
        select coalesce(jsonb_agg(
          jsonb_build_object(
            'id', sec.id,
            'name', sec.name,
            'description', sec.description,
            'order', sec.order,
            'schema_id', sec.schema_id,
            'created_at', sec.created_at,
            'updated_at', sec.updated_at,
            'cms_schema_fields', (
              select coalesce(jsonb_agg(
                jsonb_build_object(
                  'id', f.id,
                  'name', f.name,
                  'type', f.type,
                  'required', f.required,
                  'default_value', f.default_value,
                  'validation', f.validation,
                  'order', f.order,
                  'parent_field_id', f.parent_field_id,
                  'schema_section_id', f.schema_section_id,
                  'created_at', f.created_at,
                  'updated_at', f.updated_at
                ) order by f.order nulls last
              ), '[]'::jsonb)
              from public.cms_schema_fields f
              where f.schema_section_id = sec.id
            )
          ) order by sec.order nulls last
        ), '[]'::jsonb)
        from public.cms_schema_sections sec
        where sec.schema_id = s.id
      )
    )
  into v_schema
  from public.cms_schemas s
  where s.id = v_schema_id
    and s.tenant_id = p_tenant_id;

  -- Check if schema exists and belongs to tenant
  if v_schema is null then
    raise exception 'Schema not found or access denied';
  end if;

  -- Combine collection and schema
  v_result := v_collection || jsonb_build_object('cms_schemas', v_schema);

  -- Return success response
  return jsonb_build_object(
    'success', true,
    'data', v_result
  );

exception
  when others then
    return jsonb_build_object(
      'success', false,
      'error', sqlerrm
    );
end;
$$;

-- Add comment
comment on function public.get_collection_with_schema(uuid, uuid) is 
  'Fetches a collection with its full schema including sections and fields in a single RPC call. Requires collection_id and tenant_id for access control.';

