-- Update the get_page function to use the new linking system
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
  schema_record RECORD;
  section_record RECORD;
  sections_array JSONB := '[]'::JSONB;
  section_json JSONB;
BEGIN
  -- Get the page record with schema info
  SELECT p.*, s.name as schema_name, s.description as schema_description, 
         s.template as schema_template, s.updated_at as schema_updated_at
  INTO page_record
  FROM cms_pages p
  LEFT JOIN cms_schemas s ON p.schema_id = s.id
  WHERE p.id = page_id_param
    AND p.website_id = website_id_param;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Page not found: %', page_id_param;
  END IF;

  -- If no schema is assigned, return empty sections
  IF page_record.schema_id IS NULL THEN
    RETURN QUERY SELECT 
      page_record.id,
      page_record.name,
      page_record.slug,
      page_record.description,
      page_record.status,
      page_record.website_id,
      page_record.created_at,
      page_record.updated_at,
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      NULL::BOOLEAN,
      NULL::TIMESTAMPTZ,
      '[]'::JSONB;
    RETURN;
  END IF;

  -- Loop through schema sections to build the structure
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
      'fields', build_schema_fields_with_content_v2(section_record.id, page_id_param, NULL)
    );

    sections_array := sections_array || section_json;
  END LOOP;

  -- Return the page with schema structure and content
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

-- Updated function to build schema fields with content using the new linking system
CREATE OR REPLACE FUNCTION build_schema_fields_with_content_v2(
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
  content_field_id UUID;
BEGIN
  -- Get schema fields at this level
  FOR field_record IN
    SELECT sf.* 
    FROM cms_schema_fields sf
    WHERE sf.schema_section_id = schema_section_id_param
      AND sf.parent_field_id IS NOT DISTINCT FROM parent_field_id_param
    ORDER BY sf."order" ASC
  LOOP
    -- Try to get content for this field using the new linking system
    content_value := NULL;
    content_field_id := NULL;
    
    -- First try to find content by schema_field_id (preferred method)
    SELECT cf.content, cf.id INTO content_record, content_field_id
    FROM cms_content_fields cf
    JOIN cms_content_sections cs ON cf.section_id = cs.id
    WHERE cs.page_id = page_id_param
      AND cf.schema_field_id = field_record.id
    LIMIT 1;
    
    -- If not found, fall back to the old method (name + type matching)
    IF NOT FOUND THEN
      SELECT cf.content, cf.id INTO content_record, content_field_id
      FROM cms_content_fields cf
      JOIN cms_content_sections cs ON cf.section_id = cs.id
      WHERE cs.page_id = page_id_param
        AND cf.name = field_record.name
        AND cf.type = field_record.type
        AND cf.parent_field_id IS NOT DISTINCT FROM parent_field_id_param
        AND cf.schema_field_id IS NULL  -- Only match unlinked content fields
      LIMIT 1;
      
      -- If found with old method, link it to the schema field
      IF FOUND THEN
        UPDATE cms_content_fields 
        SET schema_field_id = field_record.id
        WHERE id = content_field_id;
      END IF;
    END IF;
    
    IF FOUND THEN
      content_value := content_record.content;
    END IF;

    field_json := jsonb_build_object(
      'id', field_record.id,
      'name', field_record.name,
      'field_key', field_record.field_key,
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
      'content_field_id', content_field_id  -- Include content field ID for direct updates
    );

    -- Recursively attach children if section field
    IF field_record.type = 'section' THEN
      nested_fields := build_schema_fields_with_content_v2(schema_section_id_param, page_id_param, field_record.id);
      field_json := field_json || jsonb_build_object('fields', nested_fields);
    END IF;

    fields_array := fields_array || field_json;
  END LOOP;

  RETURN fields_array;
END;
$$;

-- Updated function to save field content using the new linking system
CREATE OR REPLACE FUNCTION save_field_content_v2(
  page_id_param UUID,
  schema_field_id_param UUID,
  content_value JSONB,
  parent_field_id_param UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  schema_field_record RECORD;
  content_section_id UUID;
  content_field_id UUID;
BEGIN
  -- Get schema field details
  SELECT sf.*, ss.id as schema_section_id
  INTO schema_field_record
  FROM cms_schema_fields sf
  JOIN cms_schema_sections ss ON sf.schema_section_id = ss.id
  WHERE sf.id = schema_field_id_param;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Schema field not found: %', schema_field_id_param;
  END IF;

  -- Get or create content section
  content_section_id := get_or_create_content_section(page_id_param, schema_field_record.schema_section_id);

  -- Try to find existing content field by schema_field_id (preferred method)
  SELECT cf.id INTO content_field_id
  FROM cms_content_fields cf
  WHERE cf.section_id = content_section_id
    AND cf.schema_field_id = schema_field_id_param;

  -- If not found, try the old method and link it
  IF NOT FOUND THEN
    SELECT cf.id INTO content_field_id
    FROM cms_content_fields cf
    WHERE cf.section_id = content_section_id
      AND cf.name = schema_field_record.name
      AND cf.type = schema_field_record.type
      AND cf.parent_field_id IS NOT DISTINCT FROM parent_field_id_param
      AND cf.schema_field_id IS NULL;
  END IF;

  -- If found, update it
  IF FOUND THEN
    UPDATE cms_content_fields
    SET content = content_value, 
        updated_at = NOW(),
        schema_field_id = schema_field_id_param  -- Ensure it's linked
    WHERE id = content_field_id;
  ELSE
    -- If not found, create it
    INSERT INTO cms_content_fields (
      section_id, name, type, required, default_value, validation, 
      "order", parent_field_id, content, schema_field_id
    )
    VALUES (
      content_section_id,
      schema_field_record.name,
      schema_field_record.type,
      schema_field_record.required,
      schema_field_record.default_value,
      schema_field_record.validation,
      schema_field_record."order",
      parent_field_id_param,
      content_value,
      schema_field_id_param
    )
    RETURNING id INTO content_field_id;
  END IF;

  RETURN content_field_id;
END;
$$;

-- Function to initialize content fields when a schema is assigned to a page
CREATE OR REPLACE FUNCTION initialize_page_content(
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
          AND schema_field_id = field_record.id
      ) THEN
        -- Create content field with default value
        INSERT INTO cms_content_fields (
          section_id, name, type, required, default_value, validation,
          "order", parent_field_id, content, schema_field_id
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
          END,
          field_record.id
        );
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- Function to detect schema changes and return affected pages
CREATE OR REPLACE FUNCTION detect_schema_changes(
  schema_id_param UUID
)
RETURNS TABLE (
  page_id UUID,
  page_name TEXT,
  change_type TEXT,
  change_description TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  page_record RECORD;
  schema_updated_at TIMESTAMPTZ;
BEGIN
  -- Get schema updated timestamp
  SELECT updated_at INTO schema_updated_at
  FROM cms_schemas
  WHERE id = schema_id_param;
  
  -- Find pages that were created before the schema was last updated
  FOR page_record IN
    SELECT p.id, p.name, p.created_at
    FROM cms_pages p
    WHERE p.schema_id = schema_id_param
      AND p.created_at < schema_updated_at
  LOOP
    RETURN QUERY SELECT 
      page_record.id,
      page_record.name,
      'schema_updated'::TEXT,
      'Schema was updated after this page was created'::TEXT;
  END LOOP;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_page(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION build_schema_fields_with_content_v2(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION save_field_content_v2(UUID, UUID, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_page_content(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION detect_schema_changes(UUID) TO authenticated;


