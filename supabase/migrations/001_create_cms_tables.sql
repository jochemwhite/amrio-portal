-- Complete CMS Database Schema Migration
-- Run this script in your Supabase SQL editor

-- Create enum for field types
CREATE TYPE field_type AS ENUM (
  'text',
  'number', 
  'boolean',
  'date',
  'richtext',
  'image',
  'reference'
);

-- Create enum for page status
CREATE TYPE page_status AS ENUM (
  'draft',
  'active',
  'archived'
);

-- Create CMS websites table
CREATE TABLE cms_websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  domain TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create CMS pages table
CREATE TABLE cms_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID REFERENCES cms_websites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL,
  status page_status DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT cms_pages_slug_website_unique UNIQUE (slug, website_id)
);

-- Create CMS sections table
CREATE TABLE cms_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES cms_pages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create CMS fields table
CREATE TABLE cms_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES cms_sections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type field_type NOT NULL,
  required BOOLEAN DEFAULT FALSE,
  default_value TEXT,
  validation TEXT,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_cms_websites_tenant_id ON cms_websites(tenant_id);
CREATE INDEX idx_cms_websites_domain ON cms_websites(domain);
CREATE INDEX idx_cms_websites_status ON cms_websites(status);
CREATE INDEX idx_cms_pages_website_id ON cms_pages(website_id);
CREATE INDEX idx_cms_pages_status ON cms_pages(status);
CREATE INDEX idx_cms_sections_page_id ON cms_sections(page_id);
CREATE INDEX idx_cms_fields_section_id ON cms_fields(section_id);
CREATE INDEX idx_cms_fields_order ON cms_fields("order");

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_cms_websites_updated_at 
  BEFORE UPDATE ON cms_websites 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cms_pages_updated_at 
  BEFORE UPDATE ON cms_pages 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cms_sections_updated_at 
  BEFORE UPDATE ON cms_sections 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cms_fields_updated_at 
  BEFORE UPDATE ON cms_fields 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies (enable row level security)
ALTER TABLE cms_websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_fields ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read/write CMS data
-- In production, you might want more specific policies based on tenant_id
CREATE POLICY "Allow authenticated users to manage CMS websites" ON cms_websites
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage CMS pages" ON cms_pages
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage CMS sections" ON cms_sections
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage CMS fields" ON cms_fields
  FOR ALL USING (auth.role() = 'authenticated'); 