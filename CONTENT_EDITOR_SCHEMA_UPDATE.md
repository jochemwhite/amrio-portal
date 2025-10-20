# Content Editor Schema-Based Update

## Overview
Updated the content editor to work with the new schema-based database functions. The system now properly links content fields to schema fields using both `schema_field_id` (for structure) and `content_field_id` (for actual content storage).

## Changes Made

### 1. Page Content Loader (`src/app/dashboard/(cms)/websites/[websiteId]/[pageId]/content/page.tsx`)
**What changed:**
- Updated field mapping to include `content_field_id` alongside the schema field `id`
- Added comments explaining the dual-ID system

**Why:**
- The new `get_page` RPC function returns both schema field IDs (for structure) and content field IDs (for updates)
- This allows the editor to know which actual content field to update when saving

### 2. Content Editor Store (`src/stores/useContentEditorStore.ts`)
**What changed:**
- Added `content_field_id` property to `FieldWithValue` interface
- Added `content_field_id` to `updatedFields` array items
- Updated `setFieldValue` to track `content_field_id` for each field

**Why:**
- Need to track both IDs to properly save content
- Schema field ID is used as the primary identifier in the UI
- Content field ID is used when saving to the database

### 3. Save Content Action (`src/actions/cms/schema-content-actions.ts`)
**What changed:**
- Updated `savePageContent` function signature to accept `content_field_id`
- Modified save logic to use `content_field_id` when available, fallback to `schema_field_id`
- Updated `initializePageContent` to use the new RPC function `initialize_page_content`

**Why:**
- Direct updates by content field ID are faster and more reliable
- Fallback to schema field ID handles edge cases
- Using RPC function ensures proper initialization of content structure

### 4. Type Definitions (`src/types/cms.ts`)
**What changed:**
- Added `content_field_id` property to `RPCPageField` type
- Added comments explaining the dual-ID system

**Why:**
- TypeScript types need to match the actual data structure from the database

## How It Works Now

### Data Flow

1. **Loading Content:**
   ```
   get_page RPC → Returns fields with:
   - id (schema field ID)
   - content_field_id (actual content field ID)
   - content (the saved data)
   ```

2. **Editing Content:**
   ```
   User types → setFieldValue → Store tracks:
   - Schema field ID (for UI identification)
   - Content field ID (for database updates)
   - New content value
   ```

3. **Saving Content:**
   ```
   saveContent → Updates cms_content_fields:
   - Uses content_field_id if available (direct update)
   - Falls back to schema_field_id (query by relationship)
   ```

### Dual-ID System Explained

**Schema Field ID (`id`):**
- Comes from `cms_schema_fields` table
- Defines the structure (what fields should exist)
- Stable across multiple pages using the same schema
- Used as the primary identifier in the UI

**Content Field ID (`content_field_id`):**
- Comes from `cms_content_fields` table
- Stores the actual user-entered data
- Unique per page
- Used when saving updates to the database

## Benefits

1. **Schema Reusability:** Multiple pages can share the same schema structure
2. **Content Isolation:** Each page has its own content values
3. **Automatic Migration:** Old content gets linked to schema fields automatically
4. **Backward Compatible:** Falls back to name/type matching for old content
5. **Performance:** Direct updates by content field ID are fast

## Database Functions Used

1. **`get_page(page_id, website_id)`**
   - Returns page with schema structure and content merged together
   - Includes both schema field IDs and content field IDs

2. **`initialize_page_content(page_id, schema_id)`**
   - Creates content field structure when schema is assigned to a page
   - Links content fields to schema fields via `schema_field_id`

3. **`build_schema_fields_with_content(section_id, page_id, parent_id)`**
   - Helper function that recursively builds field structure
   - Merges schema definition with actual content

## Testing Checklist

- [ ] Load a page with existing content - should display correctly
- [ ] Edit a field and save - should update the correct content field
- [ ] Assign a schema to a new page - should initialize content structure
- [ ] Edit nested fields (section type) - should save correctly
- [ ] Check that content_field_id is present in field data
- [ ] Verify that saves use content_field_id when available

## Migration Notes

If you have existing pages with content that need to be linked to schemas:

1. Ensure schemas are assigned to pages:
   ```sql
   UPDATE cms_pages SET schema_id = 'your-schema-id' WHERE id = 'page-id';
   ```

2. Run the migration function:
   ```sql
   SELECT migrate_existing_content_to_schemas();
   ```

This will:
- Create content fields for any missing schema fields
- Link existing content fields to their corresponding schema fields
- Preserve all existing content

## Future Improvements

1. Consider using the new `save_page_content` RPC function for batch updates
2. Add validation using schema field validation rules
3. Show visual indicators when schema has been updated since page was created
4. Add UI to re-sync page content when schema changes




