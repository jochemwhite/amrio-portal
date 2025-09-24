-- RPC function to get page data with nested sections
-- RLS policies on the tables will handle access control automatically

CREATE OR REPLACE FUNCTION get_page_with_nested_sections(
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
  field_record RECORD;
  sections_array JSONB := '[]'::JSONB;
  section_json JSONB;
  fields_array JSONB;
  field_json JSONB;
  nested_fields_array JSONB;
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
    fields_array := '[]'::JSONB;
    
    -- Get all fields for this section (RLS will handle access control)
    FOR field_record IN 
      SELECT * FROM cms_fields 
      WHERE section_id = section_record.id 
      ORDER BY "order" ASC
    LOOP
      -- Check if this field has nested fields (parent_field_id is NULL means it's a top-level field)
      IF field_record.parent_field_id IS NULL THEN
        -- This is a top-level field
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
          'updated_at', field_record.updated_at,
          'content', field_record.content
        );
        
        -- If this is a section field, get its nested fields
        IF field_record.type = 'section' THEN
          nested_fields_array := '[]'::JSONB;
          
          -- Get nested fields for this section field (RLS will handle access control)
          FOR nested_field IN 
            SELECT * FROM cms_fields 
            WHERE parent_field_id = field_record.id 
            ORDER BY "order" ASC
          LOOP
            nested_fields_array := nested_fields_array || jsonb_build_object(
              'id', nested_field.id,
              'name', nested_field.name,
              'type', nested_field.type,
              'required', nested_field.required,
              'default_value', nested_field.default_value,
              'validation', nested_field.validation,
              'order', nested_field.order,
              'parent_field_id', nested_field.parent_field_id,
              'created_at', nested_field.created_at,
              'updated_at', nested_field.updated_at,
              'content', nested_field.content
            );
          END LOOP;
          
          -- Add nested fields to the section field
          field_json := field_json || jsonb_build_object('fields', nested_fields_array);
        END IF;
        
        fields_array := fields_array || field_json;
      END IF;
    END LOOP;
    
    -- Build section JSON
    section_json := jsonb_build_object(
      'id', section_record.id,
      'name', section_record.name,
      'description', section_record.description,
      'page_id', section_record.page_id,
      'order', section_record.order,
      'created_at', section_record.created_at,
      'updated_at', section_record.updated_at,
      'fields', fields_array
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_page_with_nested_sections(UUID, UUID) TO authenticated;
