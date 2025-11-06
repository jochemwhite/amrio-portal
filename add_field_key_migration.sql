-- =====================================================
-- Migration: Add field_key to CMS Schema Fields
-- =====================================================
-- This migration adds a field_key column to cms_schema_fields
-- and updates all related functions to include it in their output

-- =====================================================
-- PART 1: Add field_key column to cms_schema_fields
-- =====================================================

-- Add the field_key column
ALTER TABLE cms_schema_fields 
ADD COLUMN IF NOT EXISTS field_key TEXT;

-- Populate field_key with existing name values (as a starting point)
-- You can manually update these to be more programmatic (e.g., snake_case slugs)
UPDATE cms_schema_fields 
SET field_key = name 
WHERE field_key IS NULL;

-- Make field_key NOT NULL after populating
ALTER TABLE cms_schema_fields 
ALTER COLUMN field_key SET NOT NULL;

-- Add a unique constraint for field_key within each schema section
-- This ensures field_keys are unique within a section
CREATE UNIQUE INDEX IF NOT EXISTS idx_schema_fields_field_key_unique 
ON cms_schema_fields(schema_section_id, field_key);

-- Add an index for better query performance
CREATE INDEX IF NOT EXISTS idx_schema_fields_field_key 
ON cms_schema_fields(field_key);

-- =====================================================
-- PART 2: Update build_nested_content_fields_recursive
-- =====================================================
-- This function is used by get_page_content to build the nested field structure

CREATE OR REPLACE FUNCTION public.build_nested_content_fields_recursive(
  section_id_param uuid, 
  parent_field_id_param uuid
)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
DECLARE
  field_record RECORD;
  fields_array JSONB := '[]'::JSONB;
  field_json JSONB;
  nested_fields JSONB;
  resolved_content JSONB;
BEGIN
  -- Get fields at this level with schema field data including field_key
  FOR field_record IN
    SELECT f.*, sf.name as schema_field_name, sf.field_key as schema_field_key
    FROM cms_content_fields f
    LEFT JOIN cms_schema_fields sf ON f.schema_field_id = sf.id
    WHERE f.section_id = section_id_param
      AND f.parent_field_id IS NOT DISTINCT FROM parent_field_id_param
    ORDER BY f."order" ASC
  LOOP
    -- Start with basic field info including field_key
    field_json := jsonb_build_object(
      'id', field_record.id,
      'field_key', field_record.schema_field_key,
      'name', field_record.schema_field_name,
      'type', field_record.type,
      'order', field_record."order"
    );

    -- Handle different field types
    IF field_record.type = 'section' THEN
      -- Recursively attach children for section fields
      nested_fields := build_nested_content_fields_recursive(section_id_param, field_record.id);
      field_json := field_json || jsonb_build_object('fields', nested_fields);
    ELSIF field_record.type = 'reference' AND field_record.collection_id IS NOT NULL THEN
      -- Resolve collection reference
      resolved_content := resolve_collection_reference(
        field_record.content,
        field_record.collection_id
      );
      field_json := field_json || jsonb_build_object('content', resolved_content);
    ELSE
      -- Regular content field
      field_json := field_json || jsonb_build_object('content', field_record.content);
    END IF;

    fields_array := fields_array || field_json;
  END LOOP;

  RETURN fields_array;
END;
$function$;

-- =====================================================
-- PART 3: Update build_schema_fields_with_content
-- =====================================================
-- This function is used to build page fields with schema definitions

CREATE OR REPLACE FUNCTION public.build_schema_fields_with_content(
  schema_section_id_param uuid, 
  page_id_param uuid, 
  parent_field_id_param uuid DEFAULT NULL::uuid
)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
DECLARE
  field_record RECORD;
  fields_array JSONB := '[]'::JSONB;
  field_json JSONB;
  nested_fields JSONB;
  content_value JSONB;
  content_collection_id UUID;
  content_field_id UUID;
BEGIN
  -- Loop through all schema fields at this level
  FOR field_record IN
    SELECT sf.* 
    FROM cms_schema_fields sf
    WHERE sf.schema_section_id = schema_section_id_param
      AND sf.parent_field_id IS NOT DISTINCT FROM parent_field_id_param
    ORDER BY sf."order" ASC
  LOOP
    -- Initialize content variables
    content_value := NULL;
    content_field_id := NULL;
    content_collection_id := NULL;
    
    -- Try to find content using schema_field_id (preferred method)
    SELECT cf.content, cf.collection_id, cf.id INTO content_value, content_collection_id, content_field_id
    FROM cms_content_fields cf
    JOIN cms_content_sections cs ON cf.section_id = cs.id
    WHERE cs.page_id = page_id_param
      AND cf.schema_field_id = field_record.id
    LIMIT 1;
    
    -- Fall back to old method (match by name + type)
    IF NOT FOUND THEN
      SELECT cf.content, cf.id INTO content_value, content_field_id
      FROM cms_content_fields cf
      JOIN cms_content_sections cs ON cf.section_id = cs.id
      WHERE cs.page_id = page_id_param
        AND cf.name = field_record.name
        AND cf.type = field_record.type
        AND cf.parent_field_id IS NOT DISTINCT FROM parent_field_id_param
        AND cf.schema_field_id IS NULL
      LIMIT 1;
      
      -- Link old content to schema field
      IF FOUND THEN
        UPDATE cms_content_fields 
        SET schema_field_id = field_record.id
        WHERE id = content_field_id;
      END IF;
    END IF;

    -- Build the field JSON object with schema definition + content + field_key
    field_json := jsonb_build_object(
      'id', field_record.id,
      'field_key', field_record.field_key,          -- NEW: field_key
      'name', field_record.name,
      'type', field_record.type,
      'required', field_record.required,
      'default_value', field_record.default_value,
      'validation', field_record.validation,
      'order', field_record."order",
      'parent_field_id', field_record.parent_field_id,
      'created_at', field_record.created_at,
      'updated_at', field_record.updated_at,
      'content', content_value,
      'collection_id', content_collection_id,
      'content_field_id', content_field_id
    );

    -- If this is a 'section' type field, recursively get its nested fields
    IF field_record.type = 'section' THEN
      nested_fields := build_schema_fields_with_content(
        schema_section_id_param, 
        page_id_param, 
        field_record.id
      );
      field_json := field_json || jsonb_build_object('fields', nested_fields);
    END IF;

    fields_array := fields_array || field_json;
  END LOOP;

  RETURN fields_array;
END;
$function$;

-- =====================================================
-- PART 4: Update build_collection_entry_data
-- =====================================================
-- This function is used to build collection entry data

CREATE OR REPLACE FUNCTION public.build_collection_entry_data(
  collection_id_param uuid, 
  entry_id_param uuid
)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
DECLARE
  entry_record RECORD;
  items_array JSONB := '[]'::JSONB;
  item_record RECORD;
  item_json JSONB;
BEGIN
  -- Get the entry record
  SELECT e.* INTO entry_record
  FROM cms_collection_entries e
  WHERE e.id = entry_id_param
    AND e.collection_id = collection_id_param;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Get all items for this entry with field_key from schema
  FOR item_record IN
    SELECT i.*, sf.field_key as schema_field_key, sf.name as schema_field_name
    FROM cms_collections_items i
    LEFT JOIN cms_schema_fields sf ON i.schema_field_id = sf.id
    WHERE i.cms_collection_entry_id = entry_id_param
      AND i.collection_id = collection_id_param
      AND i.parent_field_id IS NULL
    ORDER BY i."order" ASC
  LOOP
    item_json := jsonb_build_object(
      'id', item_record.id,
      'field_key', item_record.schema_field_key,    -- NEW: field_key
      'name', COALESCE(item_record.schema_field_name, item_record.name),
      'field_type', item_record.field_type,
      'content', item_record.content,
      'order', item_record."order"
    );

    -- If this item has nested items (like a section field), recursively get them
    IF item_record.field_type = 'section' THEN
      item_json := item_json || jsonb_build_object(
        'items', build_collection_nested_items(item_record.id, collection_id_param)
      );
    END IF;

    items_array := items_array || item_json;
  END LOOP;

  -- Return the complete entry with items
  RETURN jsonb_build_object(
    'id', entry_record.id,
    'name', entry_record.name,
    'items', items_array
  );
END;
$function$;

-- =====================================================
-- PART 5: Update build_collection_nested_items
-- =====================================================
-- This function is used to build nested collection items

CREATE OR REPLACE FUNCTION public.build_collection_nested_items(
  parent_item_id uuid, 
  collection_id_param uuid
)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
DECLARE
  item_record RECORD;
  items_array JSONB := '[]'::JSONB;
  item_json JSONB;
BEGIN
  FOR item_record IN
    SELECT i.*, sf.field_key as schema_field_key, sf.name as schema_field_name
    FROM cms_collections_items i
    LEFT JOIN cms_schema_fields sf ON i.schema_field_id = sf.id
    WHERE i.parent_field_id = parent_item_id
      AND i.collection_id = collection_id_param
    ORDER BY i."order" ASC
  LOOP
    item_json := jsonb_build_object(
      'id', item_record.id,
      'field_key', item_record.schema_field_key,    -- NEW: field_key
      'name', COALESCE(item_record.schema_field_name, item_record.name),
      'field_type', item_record.field_type,
      'content', item_record.content,
      'order', item_record."order"
    );

    -- Recursively get nested items if this is a section
    IF item_record.field_type = 'section' THEN
      item_json := item_json || jsonb_build_object(
        'items', build_collection_nested_items(item_record.id, collection_id_param)
      );
    END IF;

    items_array := items_array || item_json;
  END LOOP;

  RETURN items_array;
END;
$function$;

-- =====================================================
-- PART 6: Add helpful comment
-- =====================================================

COMMENT ON COLUMN cms_schema_fields.field_key IS 
  'Unique key identifier for the field within a section. Used for programmatic access (e.g., "hero_title", "cta_button").';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
-- After running this migration:
-- 1. All schema fields will have a field_key column
-- 2. All functions returning field data will include field_key
-- 3. You can now access fields by their field_key instead of name
-- 4. Consider updating your field_keys to use snake_case or kebab-case
--    for better programmatic access (e.g., "Hero Title" -> "hero_title")
-- =====================================================

