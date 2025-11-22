-- Create enum for layout template types
CREATE TYPE layout_template_type AS ENUM ('header', 'footer');

-- Create enum for condition types
CREATE TYPE layout_condition_type AS ENUM ('all_pages', 'specific_pages', 'page_pattern');

-- ============================================
-- Table: cms_layout_templates
-- Description: Stores header and footer templates for websites
-- ============================================
CREATE TABLE cms_layout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type layout_template_type NOT NULL,
  description TEXT,
  schema_id UUID NOT NULL REFERENCES cms_schemas(id) ON DELETE CASCADE,
  website_id UUID NOT NULL REFERENCES cms_websites(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure only one default template per type per website
  CONSTRAINT unique_default_per_website_type 
    EXCLUDE (website_id WITH =, type WITH =) WHERE (is_default = TRUE)
);

-- ============================================
-- Table: cms_layout_template_content
-- Description: Stores the actual content for layout templates
-- ============================================
CREATE TABLE cms_layout_template_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES cms_layout_templates(id) ON DELETE CASCADE,
  schema_field_id UUID NOT NULL REFERENCES cms_schema_fields(id) ON DELETE CASCADE,
  content JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one content entry per field per template
  CONSTRAINT unique_template_field UNIQUE (template_id, schema_field_id)
);

-- ============================================
-- Table: cms_layout_assignments
-- Description: Conditional assignment rules for templates
-- ============================================
CREATE TABLE cms_layout_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES cms_layout_templates(id) ON DELETE CASCADE,
  website_id UUID NOT NULL REFERENCES cms_websites(id) ON DELETE CASCADE,
  condition_type layout_condition_type NOT NULL,
  condition_value JSONB NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Index for efficient lookups
  CONSTRAINT unique_assignment_priority 
    UNIQUE (website_id, template_id, priority)
);

-- ============================================
-- Table: cms_page_layout_overrides
-- Description: Page-specific header/footer overrides
-- ============================================
CREATE TABLE cms_page_layout_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES cms_pages(id) ON DELETE CASCADE,
  header_template_id UUID REFERENCES cms_layout_templates(id) ON DELETE SET NULL,
  footer_template_id UUID REFERENCES cms_layout_templates(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one override per page
  CONSTRAINT unique_page_override UNIQUE (page_id),
  
  -- Check that header template is actually a header
  CONSTRAINT check_header_type CHECK (
    header_template_id IS NULL OR 
    EXISTS (
      SELECT 1 FROM cms_layout_templates 
      WHERE id = header_template_id AND type = 'header'
    )
  ),
  
  -- Check that footer template is actually a footer
  CONSTRAINT check_footer_type CHECK (
    footer_template_id IS NULL OR 
    EXISTS (
      SELECT 1 FROM cms_layout_templates 
      WHERE id = footer_template_id AND type = 'footer'
    )
  )
);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX idx_layout_templates_website ON cms_layout_templates(website_id);
CREATE INDEX idx_layout_templates_tenant ON cms_layout_templates(tenant_id);
CREATE INDEX idx_layout_templates_type ON cms_layout_templates(type);
CREATE INDEX idx_layout_templates_is_default ON cms_layout_templates(is_default);
CREATE INDEX idx_layout_template_content_template ON cms_layout_template_content(template_id);
CREATE INDEX idx_layout_assignments_website ON cms_layout_assignments(website_id);
CREATE INDEX idx_layout_assignments_template ON cms_layout_assignments(template_id);
CREATE INDEX idx_layout_assignments_priority ON cms_layout_assignments(website_id, priority DESC);
CREATE INDEX idx_page_layout_overrides_page ON cms_page_layout_overrides(page_id);

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cms_layout_templates_updated_at
  BEFORE UPDATE ON cms_layout_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cms_layout_template_content_updated_at
  BEFORE UPDATE ON cms_layout_template_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS
ALTER TABLE cms_layout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_layout_template_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_layout_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_page_layout_overrides ENABLE ROW LEVEL SECURITY;

-- cms_layout_templates policies
CREATE POLICY "Users can view layout templates in their tenant"
  ON cms_layout_templates FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert layout templates"
  ON cms_layout_templates FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update layout templates"
  ON cms_layout_templates FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete layout templates"
  ON cms_layout_templates FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants 
      WHERE user_id = auth.uid()
    )
  );

-- cms_layout_template_content policies
CREATE POLICY "Users can view layout template content in their tenant"
  ON cms_layout_template_content FOR SELECT
  USING (
    template_id IN (
      SELECT id FROM cms_layout_templates 
      WHERE tenant_id IN (
        SELECT tenant_id FROM user_tenants 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage layout template content"
  ON cms_layout_template_content FOR ALL
  USING (
    template_id IN (
      SELECT id FROM cms_layout_templates 
      WHERE tenant_id IN (
        SELECT tenant_id FROM user_tenants 
        WHERE user_id = auth.uid()
      )
    )
  );

-- cms_layout_assignments policies
CREATE POLICY "Users can view layout assignments in their tenant"
  ON cms_layout_assignments FOR SELECT
  USING (
    website_id IN (
      SELECT id FROM cms_websites 
      WHERE tenant_id IN (
        SELECT tenant_id FROM user_tenants 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage layout assignments"
  ON cms_layout_assignments FOR ALL
  USING (
    website_id IN (
      SELECT id FROM cms_websites 
      WHERE tenant_id IN (
        SELECT tenant_id FROM user_tenants 
        WHERE user_id = auth.uid()
      )
    )
  );

-- cms_page_layout_overrides policies
CREATE POLICY "Users can view page layout overrides in their tenant"
  ON cms_page_layout_overrides FOR SELECT
  USING (
    page_id IN (
      SELECT id FROM cms_pages 
      WHERE tenant_id IN (
        SELECT tenant_id FROM user_tenants 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage page layout overrides"
  ON cms_page_layout_overrides FOR ALL
  USING (
    page_id IN (
      SELECT id FROM cms_pages 
      WHERE tenant_id IN (
        SELECT tenant_id FROM user_tenants 
        WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE cms_layout_templates IS 'Stores header and footer templates with schema-based content structure';
COMMENT ON TABLE cms_layout_template_content IS 'Stores the actual content values for each field in layout templates';
COMMENT ON TABLE cms_layout_assignments IS 'Defines conditional assignment rules for applying templates to pages';
COMMENT ON TABLE cms_page_layout_overrides IS 'Allows pages to override the default header/footer templates';


