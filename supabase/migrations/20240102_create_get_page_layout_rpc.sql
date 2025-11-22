-- ============================================
-- RPC Function: get_page_layout
-- Description: Resolves and returns the header and footer templates
--              with their content for a given page, following priority rules:
--              1. Page-level overrides (highest priority)
--              2. Assignment rules (by priority order)
--              3. Website default templates
--              4. NULL if no template assigned
--
-- Usage:
--   get_page_layout(page_id => 'uuid')           - Get layout for specific page
--   get_page_layout(website_id => 'uuid')        - Get default layout for website
--   get_page_layout(page_id => 'uuid', website_id => 'uuid') - Explicit both
-- ============================================

CREATE OR REPLACE FUNCTION get_page_layout(
  page_id_param UUID DEFAULT NULL,
  website_id_param UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_website_id UUID;
  v_tenant_id UUID;
  v_header_template_id UUID;
  v_footer_template_id UUID;
  v_header_data JSONB;
  v_footer_data JSONB;
  v_result JSONB;
  v_skip_page_logic BOOLEAN DEFAULT FALSE;
BEGIN
  -- Determine website_id based on parameters
  IF page_id_param IS NOT NULL THEN
    -- Get website_id and tenant_id from page
    SELECT website_id, tenant_id INTO v_website_id, v_tenant_id
    FROM cms_pages
    WHERE id = page_id_param;
    
    IF v_website_id IS NULL THEN
      RAISE EXCEPTION 'Page not found';
    END IF;
  ELSIF website_id_param IS NOT NULL THEN
    -- Use provided website_id and skip page-specific logic
    v_website_id := website_id_param;
    v_skip_page_logic := TRUE;
  ELSE
    RAISE EXCEPTION 'Either page_id_param or website_id_param must be provided';
  END IF;
  
  -- ========================================
  -- RESOLVE HEADER TEMPLATE
  -- ========================================
  
  -- 1. Check for page-level override (skip if no page_id provided)
  IF NOT v_skip_page_logic THEN
    SELECT header_template_id INTO v_header_template_id
    FROM cms_page_layout_overrides
    WHERE page_id = page_id_param
      AND header_template_id IS NOT NULL;
  END IF;
  
  -- 2. If no override, check assignment rules (by priority, skip if no page_id)
  IF v_header_template_id IS NULL AND NOT v_skip_page_logic THEN
    SELECT la.template_id INTO v_header_template_id
    FROM cms_layout_assignments la
    JOIN cms_layout_templates lt ON lt.id = la.template_id
    WHERE la.website_id = v_website_id
      AND lt.type = 'header'
      AND (
        -- Match all pages
        (la.condition_type = 'all_pages')
        OR
        -- Match specific pages
        (la.condition_type = 'specific_pages' 
         AND la.condition_value::jsonb ? page_id_param::text)
        OR
        -- Match page pattern (URL slug pattern)
        (la.condition_type = 'page_pattern' 
         AND EXISTS (
           SELECT 1 FROM cms_pages 
           WHERE id = page_id_param 
             AND slug ~ (la.condition_value->>'pattern')::text
         ))
      )
    ORDER BY la.priority DESC
    LIMIT 1;
  END IF;
  
  -- 3. If still no template, use website default
  IF v_header_template_id IS NULL THEN
    SELECT id INTO v_header_template_id
    FROM cms_layout_templates
    WHERE website_id = v_website_id
      AND type = 'header'
      AND is_default = TRUE
    LIMIT 1;
  END IF;
  
  -- ========================================
  -- RESOLVE FOOTER TEMPLATE
  -- ========================================
  
  -- 1. Check for page-level override (skip if no page_id provided)
  IF NOT v_skip_page_logic THEN
    SELECT footer_template_id INTO v_footer_template_id
    FROM cms_page_layout_overrides
    WHERE page_id = page_id_param
      AND footer_template_id IS NOT NULL;
  END IF;
  
  -- 2. If no override, check assignment rules (by priority, skip if no page_id)
  IF v_footer_template_id IS NULL AND NOT v_skip_page_logic THEN
    SELECT la.template_id INTO v_footer_template_id
    FROM cms_layout_assignments la
    JOIN cms_layout_templates lt ON lt.id = la.template_id
    WHERE la.website_id = v_website_id
      AND lt.type = 'footer'
      AND (
        -- Match all pages
        (la.condition_type = 'all_pages')
        OR
        -- Match specific pages
        (la.condition_type = 'specific_pages' 
         AND la.condition_value::jsonb ? page_id_param::text)
        OR
        -- Match page pattern (URL slug pattern)
        (la.condition_type = 'page_pattern' 
         AND EXISTS (
           SELECT 1 FROM cms_pages 
           WHERE id = page_id_param 
             AND slug ~ (la.condition_value->>'pattern')::text
         ))
      )
    ORDER BY la.priority DESC
    LIMIT 1;
  END IF;
  
  -- 3. If still no template, use website default
  IF v_footer_template_id IS NULL THEN
    SELECT id INTO v_footer_template_id
    FROM cms_layout_templates
    WHERE website_id = v_website_id
      AND type = 'footer'
      AND is_default = TRUE
    LIMIT 1;
  END IF;
  
  -- ========================================
  -- BUILD HEADER DATA WITH CONTENT
  -- ========================================
  
  IF v_header_template_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'template', jsonb_build_object(
        'id', lt.id,
        'name', lt.name,
        'type', lt.type,
        'description', lt.description,
        'schema_id', lt.schema_id
      ),
      'schema', jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'description', s.description,
        'sections', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', ss.id,
              'name', ss.name,
              'description', ss.description,
              'order', ss.order,
              'fields', (
                SELECT jsonb_agg(
                  jsonb_build_object(
                    'id', sf.id,
                    'name', sf.name,
                    'field_key', sf.field_key,
                    'type', sf.type,
                    'required', sf.required,
                    'default_value', sf.default_value,
                    'validation', sf.validation,
                    'settings', sf.settings,
                    'order', sf.order,
                    'content', COALESCE(ltc.content, NULL),
                    'content_field_id', ltc.id
                  ) ORDER BY sf.order
                )
                FROM cms_schema_fields sf
                LEFT JOIN cms_layout_template_content ltc 
                  ON ltc.schema_field_id = sf.id 
                  AND ltc.template_id = v_header_template_id
                WHERE sf.schema_section_id = ss.id
                  AND sf.parent_field_id IS NULL
              )
            ) ORDER BY ss.order
          )
          FROM cms_schema_sections ss
          WHERE ss.schema_id = s.id
        )
      )
    ) INTO v_header_data
    FROM cms_layout_templates lt
    JOIN cms_schemas s ON s.id = lt.schema_id
    WHERE lt.id = v_header_template_id;
  END IF;
  
  -- ========================================
  -- BUILD FOOTER DATA WITH CONTENT
  -- ========================================
  
  IF v_footer_template_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'template', jsonb_build_object(
        'id', lt.id,
        'name', lt.name,
        'type', lt.type,
        'description', lt.description,
        'schema_id', lt.schema_id
      ),
      'schema', jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'description', s.description,
        'sections', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', ss.id,
              'name', ss.name,
              'description', ss.description,
              'order', ss.order,
              'fields', (
                SELECT jsonb_agg(
                  jsonb_build_object(
                    'id', sf.id,
                    'name', sf.name,
                    'field_key', sf.field_key,
                    'type', sf.type,
                    'required', sf.required,
                    'default_value', sf.default_value,
                    'validation', sf.validation,
                    'settings', sf.settings,
                    'order', sf.order,
                    'content', COALESCE(ltc.content, NULL),
                    'content_field_id', ltc.id
                  ) ORDER BY sf.order
                )
                FROM cms_schema_fields sf
                LEFT JOIN cms_layout_template_content ltc 
                  ON ltc.schema_field_id = sf.id 
                  AND ltc.template_id = v_footer_template_id
                WHERE sf.schema_section_id = ss.id
                  AND sf.parent_field_id IS NULL
              )
            ) ORDER BY ss.order
          )
          FROM cms_schema_sections ss
          WHERE ss.schema_id = s.id
        )
      )
    ) INTO v_footer_data
    FROM cms_layout_templates lt
    JOIN cms_schemas s ON s.id = lt.schema_id
    WHERE lt.id = v_footer_template_id;
  END IF;
  
  -- ========================================
  -- BUILD FINAL RESULT
  -- ========================================
  
  v_result := jsonb_build_object(
    'header', v_header_data,
    'footer', v_footer_data
  );
  
  RETURN v_result;
END;
$$;

-- Grant execute permission (for both function signatures)
GRANT EXECUTE ON FUNCTION get_page_layout(UUID, UUID) TO authenticated;

-- Comment
COMMENT ON FUNCTION get_page_layout IS 'Resolves and returns the header and footer templates with content. Call with page_id for full resolution, or website_id for defaults only.';


-- ============================================
-- Helper Function: get_template_with_content
-- Description: Returns a single template with all its content
-- ============================================

CREATE OR REPLACE FUNCTION get_template_with_content(template_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'template', jsonb_build_object(
      'id', lt.id,
      'name', lt.name,
      'type', lt.type,
      'description', lt.description,
      'schema_id', lt.schema_id,
      'website_id', lt.website_id,
      'is_default', lt.is_default
    ),
    'schema', jsonb_build_object(
      'id', s.id,
      'name', s.name,
      'description', s.description,
      'sections', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', ss.id,
            'name', ss.name,
            'description', ss.description,
            'order', ss.order,
            'fields', (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'id', sf.id,
                  'name', sf.name,
                  'field_key', sf.field_key,
                  'type', sf.type,
                  'required', sf.required,
                  'default_value', sf.default_value,
                  'validation', sf.validation,
                  'settings', sf.settings,
                  'order', sf.order,
                  'content', COALESCE(ltc.content, NULL),
                  'content_field_id', ltc.id
                ) ORDER BY sf.order
              )
              FROM cms_schema_fields sf
              LEFT JOIN cms_layout_template_content ltc 
                ON ltc.schema_field_id = sf.id 
                AND ltc.template_id = template_id_param
              WHERE sf.schema_section_id = ss.id
                AND sf.parent_field_id IS NULL
            )
          ) ORDER BY ss.order
        )
        FROM cms_schema_sections ss
        WHERE ss.schema_id = s.id
      )
    )
  ) INTO v_result
  FROM cms_layout_templates lt
  JOIN cms_schemas s ON s.id = lt.schema_id
  WHERE lt.id = template_id_param;
  
  RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_template_with_content(UUID) TO authenticated;

-- Comment
COMMENT ON FUNCTION get_template_with_content IS 'Returns a single layout template with all its content populated';


