-- Add content column to cms_fields table to store field values as JSONB

-- Add the content column
ALTER TABLE cms_fields ADD COLUMN content JSONB DEFAULT NULL;

-- Add an index on the content column for better performance
CREATE INDEX idx_cms_fields_content ON cms_fields USING GIN (content);

-- Add a comment to document the purpose
COMMENT ON COLUMN cms_fields.content IS 'Stores the actual field content/value as JSONB. Structure varies by field type: text uses {value}, richtext uses {content}, image uses {url}, etc.';














