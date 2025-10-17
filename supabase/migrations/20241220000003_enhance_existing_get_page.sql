-- Enhanced version of your existing get_page function to include schema information
-- This maintains backward compatibility while adding schema support

-- Main function to fetch page with sections and schema information
CREATE OR REPLACE FUNCTION get_page(
  page_id_param UUID,
  website_id_param UUID
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  status page_status,
  website_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  schema_id UUID,
  schema_name TEXT,
  schema_description TEXT,
  schema_template BOOLEAN,
  schema_updated_at TIMESTAMPTZ,
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
  -- Get the page record with schema information
  SELECT p.*, s.id as schema_id, s.name as schema_name, 
         s.description as schema_description, s.template as schema_template,
         s.updated_at as schema_updated_at
  INTO page_record
  FROM cms_pages p
  LEFT JOIN cms_schemas s ON p.schema_id = s.id
  WHERE p.id = page_id_param
    AND p.website_id = website_id_param;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Page not found: %', page_id_param;
  END IF;

  -- If page has a schema, use schema-based sections
  IF page_record.schema_id IS NOT NULL THEN
    -- Loop through schema sections and merge with content
    FOR section_record IN
      SELECT ss.* 
      FROM cms_schema_sections ss
      WHERE ss.schema_id = page_record.schema_id
      ORDER BY ss."order" ASC
    LOOP
      section_json := jsonb_build_object(
        'id', section_record.id,
        'name', section_record.name,
        'description', section_record.description,
        'schema_id', section_record.schema_id,
        'order', section_record."order",
        'created_at', section_record.created_at,
        'updated_at', section_record.updated_at,
        'is_schema_section', true,
        'fields', build_schema_fields_with_content(section_record.id, page_id_param, NULL)
      );

      sections_array := sections_array || section_json;
    END LOOP;
  ELSE
    -- Fallback to direct page sections (backward compatibility)
    FOR section_record IN
      SELECT s.* 
      FROM cms_sections s
      WHERE s.page_id = page_id_param
      ORDER BY s."order" ASC
    LOOP
      section_json := jsonb_build_object(
        'id', section_record.id,
        'name', section_record.name,
        'description', section_record.description,
        'page_id', section_record.page_id,
        'order', section_record."order",
        'created_at', section_record.created_at,
        'updated_at', section_record.updated_at,
        'is_schema_section', false,
        'fields', build_nested_fields_recursive(section_record.id, NULL)
      );

      sections_array := sections_array || section_json;
    END LOOP;
  END IF;

  -- Return the page with sections and schema information
  RETURN QUERY SELECT 
    page_record.id,
    page_record.name,
    page_record.slug,
    page_record.description,
    page_record.status,
    page_record.website_id,
    page_record.created_at,
    page_record.updated_at,
    page_record.schema_id,
    page_record.schema_name,
    page_record.schema_description,
    page_record.schema_template,
    page_record.schema_updated_at,
    sections_array;
END;
$$;

-- Function to build schema fields with their content
CREATE OR REPLACE FUNCTION build_schema_fields_with_content(
  schema_section_id_param UUID,
  page_id_param UUID,
  parent_field_id_param UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  field_record RECORD;
  content_record RECORD;
  fields_array JSONB := '[]'::JSONB;
  field_json JSONB;
  nested_fields JSONB;
  content_value JSONB;
BEGIN
  -- Get schema fields at this level
  FOR field_record IN
    SELECT sf.* 
    FROM cms_schema_fields sf
    WHERE sf.schema_section_id = schema_section_id_param
      AND sf.parent_field_id IS NOT DISTINCT FROM parent_field_id_param
    ORDER BY sf."order" ASC
  LOOP
    -- Try to get content for this field
    content_value := NULL;
    
    -- Look for content in cms_content_fields (if using content tables)
    -- This assumes you have cms_content_sections and cms_content_fields tables
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cms_content_fields') THEN
      SELECT cf.content INTO content_record
      FROM cms_content_fields cf
      JOIN cms_content_sections cs ON cf.section_id = cs.id
      WHERE cs.page_id = page_id_param
        AND cf.name = field_record.name
        AND cf.type = field_record.type
        AND cf.parent_field_id IS NOT DISTINCT FROM parent_field_id_param
      LIMIT 1;
      
      IF FOUND THEN
        content_value := content_record.content;
      END IF;
    END IF;

    field_json := jsonb_build_object(
      'id', field_record.id,
      'name', field_record.name,
      'type', field_record.type,
      'required', field_record.required,
      'default_value', field_record.default_value,
      'validation', field_record.validation,
      'order', field_record."order",
      'parent_field_id', field_record.parent_field_id,
      'schema_section_id', field_record.schema_section_id,
      'created_at', field_record.created_at,
      'updated_at', field_record.updated_at,
      'content', content_value,
      'is_schema_field', true
    );

    -- Recursively attach children if section field
    IF field_record.type = 'section' THEN
      nested_fields := build_schema_fields_with_content(schema_section_id_param, page_id_param, field_record.id);
      field_json := field_json || jsonb_build_object('fields', nested_fields);
    END IF;

    fields_array := fields_array || field_json;
  END LOOP;

  RETURN fields_array;
END;
$$;

-- Function to save field content (works with both schema and direct fields)
CREATE OR REPLACE FUNCTION save_field_content(
  page_id_param UUID,
  field_id_param UUID,
  content_value JSONB,
  is_schema_field BOOLEAN DEFAULT false,
  parent_field_id_param UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  field_record RECORD;
  section_id UUID;
  content_field_id UUID;
BEGIN
  IF is_schema_field THEN
    -- Handle schema field content
    -- Get schema field details
    SELECT sf.*, ss.id as schema_section_id
    INTO field_record
    FROM cms_schema_fields sf
    JOIN cms_schema_sections ss ON sf.schema_section_id = ss.id
    WHERE sf.id = field_id_param;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Schema field not found: %', field_id_param;
    END IF;

    -- Get or create content section
    section_id := get_or_create_content_section(page_id_param, field_record.schema_section_id);

    -- Try to find existing content field
    SELECT cf.id INTO content_field_id
    FROM cms_content_fields cf
    WHERE cf.section_id = section_id
      AND cf.name = field_record.name
      AND cf.type = field_record.type
      AND cf.parent_field_id IS NOT DISTINCT FROM parent_field_id_param;

    -- If found, update it
    IF FOUND THEN
      UPDATE cms_content_fields
      SET content = content_value, updated_at = NOW()
      WHERE id = content_field_id;
    ELSE
      -- If not found, create it
      INSERT INTO cms_content_fields (section_id, name, type, required, default_value, validation, "order", parent_field_id, content)
      VALUES (
        section_id,
        field_record.name,
        field_record.type,
        field_record.required,
        field_record.default_value,
        field_record.validation,
        field_record."order",
        parent_field_id_param,
        content_value
      )
      RETURNING id INTO content_field_id;
    END IF;
  ELSE
    -- Handle direct field content (backward compatibility)
    SELECT f.* INTO field_record
    FROM cms_fields f
    WHERE f.id = field_id_param;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Field not found: %', field_id_param;
    END IF;

    -- Update the field content directly
    UPDATE cms_fields
    SET content = content_value, updated_at = NOW()
    WHERE id = field_id_param;

    content_field_id := field_id_param;
  END IF;

  RETURN content_field_id;
END;
$$;

-- Helper function to get or create content section for a page
CREATE OR REPLACE FUNCTION get_or_create_content_section(
  page_id_param UUID,
  schema_section_id_param UUID
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  content_section_id UUID;
  schema_section_record RECORD;
BEGIN
  -- Get schema section details
  SELECT * INTO schema_section_record
  FROM cms_schema_sections
  WHERE id = schema_section_id_param;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Schema section not found: %', schema_section_id_param;
  END IF;

  -- Try to find existing content section
  SELECT cs.id INTO content_section_id
  FROM cms_content_sections cs
  WHERE cs.page_id = page_id_param
    AND cs.name = schema_section_record.name;

  -- If not found, create it
  IF NOT FOUND THEN
    INSERT INTO cms_content_sections (page_id, name, description, "order")
    VALUES (page_id_param, schema_section_record.name, schema_section_record.description, schema_section_record."order")
    RETURNING id INTO content_section_id;
  END IF;

  RETURN content_section_id;
END;
$$;

-- Function to initialize content when schema is assigned to a page
CREATE OR REPLACE FUNCTION initialize_page_content_from_schema(
  page_id_param UUID,
  schema_id_param UUID
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  section_record RECORD;
  field_record RECORD;
  content_section_id UUID;
BEGIN
  -- Loop through all sections in the schema
  FOR section_record IN
    SELECT * FROM cms_schema_sections 
    WHERE schema_id = schema_id_param
    ORDER BY "order" ASC
  LOOP
    -- Get or create content section
    content_section_id := get_or_create_content_section(page_id_param, section_record.id);
    
    -- Loop through all fields in this section
    FOR field_record IN
      SELECT * FROM cms_schema_fields 
      WHERE schema_section_id = section_record.id
      ORDER BY "order" ASC
    LOOP
      -- Check if content field already exists
      IF NOT EXISTS (
        SELECT 1 FROM cms_content_fields 
        WHERE section_id = content_section_id 
          AND name = field_record.name
          AND type = field_record.type
      ) THEN
        -- Create content field with default value
        INSERT INTO cms_content_fields (
          section_id, name, type, required, default_value, validation,
          "order", parent_field_id, content
        )
        VALUES (
          content_section_id,
          field_record.name,
          field_record.type,
          field_record.required,
          field_record.default_value,
          field_record.validation,
          field_record."order",
          field_record.parent_field_id,
          CASE 
            WHEN field_record.default_value IS NOT NULL THEN 
              CASE field_record.type
                WHEN 'boolean' THEN to_jsonb(field_record.default_value::boolean)
                WHEN 'number' THEN to_jsonb(field_record.default_value::numeric)
                ELSE to_jsonb(field_record.default_value)
              END
            ELSE NULL
          END
        );
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- Function to detect if schema has been updated since page creation
CREATE OR REPLACE FUNCTION get_schema_change_info(
  page_id_param UUID
)
RETURNS TABLE (
  has_schema BOOLEAN,
  schema_updated_after_page BOOLEAN,
  schema_name TEXT,
  schema_updated_at TIMESTAMPTZ,
  page_created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
  page_record RECORD;
  schema_record RECORD;
BEGIN
  -- Get page info
  SELECT p.*, s.name as schema_name, s.updated_at as schema_updated_at
  INTO page_record
  FROM cms_pages p
  LEFT JOIN cms_schemas s ON p.schema_id = s.id
  WHERE p.id = page_id_param;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, false, NULL::TEXT, NULL::TIMESTAMPTZ, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  RETURN QUERY SELECT 
    (page_record.schema_id IS NOT NULL) as has_schema,
    (page_record.schema_updated_at > page_record.created_at) as schema_updated_after_page,
    page_record.schema_name,
    page_record.schema_updated_at,
    page_record.created_at;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION get_page(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION build_schema_fields_with_content(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION build_nested_fields_recursive(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION save_field_content(UUID, UUID, JSONB, BOOLEAN, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_content_section(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_page_content_from_schema(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_schema_change_info(UUID) TO authenticated;


