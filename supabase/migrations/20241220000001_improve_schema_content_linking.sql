-- Migration to improve schema-content field linking
-- This adds a stable field_key to schema fields and links content fields to schema fields

-- Add field_key to schema fields for stable identification
ALTER TABLE cms_schema_fields 
ADD COLUMN IF NOT EXISTS field_key TEXT;

-- Add schema_field_id to content fields for direct linking
ALTER TABLE cms_content_fields 
ADD COLUMN IF NOT EXISTS schema_field_id UUID REFERENCES cms_schema_fields(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_cms_content_fields_schema_field_id 
ON cms_content_fields(schema_field_id);

CREATE INDEX IF NOT EXISTS idx_cms_schema_fields_field_key 
ON cms_schema_fields(field_key);

-- Function to generate field_key from name
CREATE OR REPLACE FUNCTION generate_field_key(field_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  -- Convert to lowercase and replace spaces/special chars with underscores
  RETURN lower(regexp_replace(field_name, '[^a-zA-Z0-9]', '_', 'g'));
END;
$$;

-- Update existing schema fields with field_key
UPDATE cms_schema_fields 
SET field_key = generate_field_key(name)
WHERE field_key IS NULL;

-- Function to link existing content fields to schema fields
CREATE OR REPLACE FUNCTION link_existing_content_fields()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  content_field RECORD;
  schema_field_id UUID;
BEGIN
  -- Link content fields to schema fields based on name, type, and section
  FOR content_field IN
    SELECT cf.id as content_field_id, cf.name, cf.type, cf.section_id, cs.page_id
    FROM cms_content_fields cf
    JOIN cms_content_sections cs ON cf.section_id = cs.id
    WHERE cf.schema_field_id IS NULL
  LOOP
    -- Find matching schema field
    SELECT sf.id INTO schema_field_id
    FROM cms_schema_fields sf
    JOIN cms_schema_sections ss ON sf.schema_section_id = ss.id
    JOIN cms_schemas s ON ss.schema_id = s.id
    JOIN cms_pages p ON p.schema_id = s.id
    WHERE p.id = content_field.page_id
      AND sf.name = content_field.name
      AND sf.type = content_field.type
      AND ss.name = (
        SELECT name FROM cms_schema_sections 
        WHERE id = (
          SELECT schema_section_id FROM cms_content_sections 
          WHERE id = content_field.section_id
        )
      )
    LIMIT 1;
    
    -- Update content field with schema field reference
    IF schema_field_id IS NOT NULL THEN
      UPDATE cms_content_fields 
      SET schema_field_id = schema_field_id
      WHERE id = content_field.content_field_id;
    END IF;
  END LOOP;
END;
$$;

-- Run the linking function
SELECT link_existing_content_fields();

-- Drop the temporary function
DROP FUNCTION link_existing_content_fields();

-- Make field_key required for new fields
ALTER TABLE cms_schema_fields 
ALTER COLUMN field_key SET NOT NULL;

-- Add unique constraint on field_key per schema section
ALTER TABLE cms_schema_fields 
ADD CONSTRAINT unique_field_key_per_section 
UNIQUE (schema_section_id, field_key);

-- Grant permissions
GRANT EXECUTE ON FUNCTION generate_field_key(TEXT) TO authenticated;


