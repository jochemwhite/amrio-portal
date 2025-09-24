-- Advanced RPC function to get page data with unlimited nested sections
-- RLS policies on the tables will handle access control automatically

CREATE OR REPLACE FUNCTION get_page_with_recursive_nested_sections(
  page_id_param UUID,
  website_id_param UUID
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  status TEXT,
  website_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  sections JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  page_record RECORD;
  section_record RECORD;
  sections_array JSONB := '[]'::JSONB;
  section_json JSONB;
BEGIN
  -- Get the page record (RLS will handle access control)
  SELECT * INTO page_record
  FROM cms_pages 
  WHERE id = page_id_param 
  AND website_id = website_id_param;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Page not found: %', page_id_param;
  END IF;

  -- Get all sections for this page (RLS will handle access control)
  FOR section_record IN 
    SELECT * FROM cms_sections 
    WHERE page_id = page_id_param 
    ORDER BY "order" ASC
  LOOP
    -- Build section JSON with recursive field processing
    section_json := jsonb_build_object(
      'id', section_record.id,
      'name', section_record.name,
      'description', section_record.description,
      'page_id', section_record.page_id,
      'order', section_record.order,
      'created_at', section_record.created_at,
      'updated_at', section_record.updated_at,
      'fields', build_nested_fields_recursive(section_record.id, NULL)
    );
    
    sections_array := sections_array || section_json;
  END LOOP;

  -- Return the page with nested sections
  RETURN QUERY SELECT 
    page_record.id,
    page_record.name,
    page_record.slug,
    page_record.description,
    page_record.status,
    page_record.website_id,
    page_record.created_at,
    page_record.updated_at,
    sections_array;
END;
$$;

-- Helper function to recursively build nested fields
CREATE OR REPLACE FUNCTION build_nested_fields_recursive(
  section_id_param UUID,
  parent_field_id_param UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  field_record RECORD;
  fields_array JSONB := '[]'::JSONB;
  field_json JSONB;
  nested_fields JSONB;
BEGIN
  -- Get fields at this level (either top-level or children of parent_field_id)
  FOR field_record IN 
    SELECT * FROM cms_fields 
    WHERE section_id = section_id_param 
    AND parent_field_id IS NOT DISTINCT FROM parent_field_id_param
    ORDER BY "order" ASC
  LOOP
    field_json := jsonb_build_object(
      'id', field_record.id,
      'name', field_record.name,
      'type', field_record.type,
      'required', field_record.required,
      'default_value', field_record.default_value,
      'validation', field_record.validation,
      'order', field_record.order,
      'parent_field_id', field_record.parent_field_id,
      'created_at', field_record.created_at,
      'updated_at', field_record.updated_at
    );
    
    -- If this is a section field, recursively get its nested fields
    IF field_record.type = 'section' THEN
      nested_fields := build_nested_fields_recursive(section_id_param, field_record.id);
      field_json := field_json || jsonb_build_object('fields', nested_fields);
    END IF;
    
    fields_array := fields_array || field_json;
  END LOOP;
  
  RETURN fields_array;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_page_with_recursive_nested_sections(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION build_nested_fields_recursive(UUID, UUID) TO authenticated;

-- Example usage:
-- SELECT * FROM get_page_with_recursive_nested_sections('page-uuid', 'website-uuid');
