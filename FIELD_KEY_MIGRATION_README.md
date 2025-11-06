# Field Key Migration Guide

## Overview

This migration adds a `field_key` column to the CMS schema fields system. The `field_key` is a unique, programmatic identifier for each field within a schema section, making it easier to access field data in your application code.

## What Changed

### Database Changes

1. **New Column**: `cms_schema_fields.field_key`
   - Type: `TEXT NOT NULL`
   - Purpose: Unique identifier for programmatic field access
   - Constraint: Unique within each schema section
   - Initially populated with existing `name` values

### Updated Functions

The following database functions have been updated to include `field_key` in their output:

1. **`build_nested_content_fields_recursive`** - Used by `get_page_content`
2. **`build_schema_fields_with_content`** - Used for page fields with schema
3. **`build_collection_entry_data`** - Used for collection entries
4. **`build_collection_nested_items`** - Used for nested collection items

### TypeScript Types

Updated `src/types/supabase.ts`:
- Added `field_key: string` to `cms_schema_fields.Row`
- Added `field_key: string` to `cms_schema_fields.Insert`
- Added `field_key?: string` to `cms_schema_fields.Update`

## How to Apply the Migration

### Option 1: Using Supabase Dashboard

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `add_field_key_migration.sql`
4. Copy and paste the entire content
5. Click **Run** to execute the migration

### Option 2: Using Supabase CLI

```bash
# If you have migrations set up
supabase db push

# Or run the SQL file directly
psql $DATABASE_URL -f add_field_key_migration.sql
```

### Option 3: Using the MCP Supabase Tool

If you have the Supabase MCP tool configured, you can apply the migration using the `apply_migration` command.

## After Migration

### 1. Verify the Migration

Run this query to check that `field_key` was added:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'cms_schema_fields'
AND column_name = 'field_key';
```

Expected result:
```
column_name | data_type | is_nullable
field_key   | text      | NO
```

### 2. Update Your Field Keys (Optional but Recommended)

The migration initially copies the `name` field to `field_key`. For better programmatic access, consider updating field keys to use a consistent format (e.g., snake_case):

```sql
-- Example: Update field keys to snake_case
UPDATE cms_schema_fields
SET field_key = 'hero_title'
WHERE name = 'Hero Title';

UPDATE cms_schema_fields
SET field_key = 'cta_button'
WHERE name = 'CTA Button';
```

### 3. Update Your Application Code

Now you can access fields using `field_key` instead of `name`:

**Before:**
```typescript
const heroTitle = sections[0].fields.find(f => f.name === 'Hero Title');
```

**After:**
```typescript
const heroTitle = sections[0].fields.find(f => f.field_key === 'hero_title');
```

### 4. Regenerate TypeScript Types (Optional)

If you want to ensure your types are in sync with the database:

```bash
# Using Supabase CLI
supabase gen types typescript --local > src/types/supabase.ts
```

Or use the Supabase TypeScript types generator in your project.

## API Response Changes

### Before Migration

```json
{
  "id": "123",
  "name": "Hero Title",
  "type": "text",
  "content": "Welcome to our site"
}
```

### After Migration

```json
{
  "id": "123",
  "field_key": "hero_title",
  "name": "Hero Title",
  "type": "text",
  "content": "Welcome to our site"
}
```

## Benefits

1. **Stable Identifiers**: Field keys won't change if you update display names
2. **Type Safety**: Use constants for field keys in your code
3. **Better DX**: More intuitive API for developers
4. **Consistency**: Same approach as other CMS systems

## Best Practices

### Naming Convention

Use snake_case for field keys:
- ✅ `hero_title`, `cta_button`, `background_image`
- ❌ `Hero Title`, `CTA-Button`, `backgroundImage`

### Creating New Fields

When creating new schema fields, always provide a `field_key`:

```typescript
await supabase
  .from('cms_schema_fields')
  .insert({
    name: 'Hero Title',
    field_key: 'hero_title',  // Always provide this
    type: 'text',
    schema_section_id: '...',
    // ... other fields
  });
```

### Helper Function

Consider creating a helper function to convert names to field keys:

```typescript
function nameToFieldKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// Usage
nameToFieldKey('Hero Title'); // 'hero_title'
nameToFieldKey('CTA Button!'); // 'cta_button'
```

## Rollback (If Needed)

If you need to rollback this migration:

```sql
-- Remove the field_key column
ALTER TABLE cms_schema_fields DROP COLUMN field_key;

-- Restore old functions (you'll need to have backups of the old function definitions)
```

**Note:** It's recommended to test this migration in a development environment before applying to production.

## Support

If you encounter any issues:
1. Check the Supabase logs for error messages
2. Verify that all functions updated successfully
3. Ensure unique constraint violations are resolved
4. Check that your application code is compatible with the new field structure

## Migration File Location

The SQL migration file is located at:
```
/home/jochemwhite/documents/github/cms/add_field_key_migration.sql
```

