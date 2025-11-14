# Collection Entry RPC Migration

## Overview

This migration creates a new RPC function `get_collection_entry` that mirrors the structure and behavior of the `get_page` RPC function. This eliminates the need for client-side data manipulation in the CollectionContentEditor component and makes the collection entry workflow consistent with the page content workflow.

## Changes Made

### 1. Database Functions (SQL)

**File:** `create_get_collection_entry_rpc.sql`

Created two new PostgreSQL functions:

#### `build_schema_fields_with_collection_items`
- Helper function that recursively builds schema fields with their associated collection item content
- Similar to `build_schema_fields_with_content` but works with `cms_collections_items` instead of `cms_content_fields`
- Handles nested section fields recursively
- Returns JSONB array of fields with content

#### `get_collection_entry`
- Main RPC function that returns a complete collection entry with schema and content
- Returns the same structure as `get_page` for consistency
- Includes:
  - Entry metadata (id, name, created_at)
  - Collection info (id, name, description)
  - Schema info (id, name, description, template)
  - Sections array with nested fields and content

**To apply:** Run the SQL file in your Supabase SQL editor or via migration.

### 2. TypeScript Types

**File:** `src/types/cms.ts`

Added new type `RPCCollectionEntryResponse`:
```typescript
export type RPCCollectionEntryResponse = {
  id: string;
  name: string;
  created_at: string;
  collection_id: string;
  collection_name: string;
  collection_description: string | null;
  schema_id: string | null;
  schema_name: string | null;
  schema_description: string | null;
  schema_template: boolean | null;
  sections: RPCPageSection[];
}
```

### 3. Server Actions

**File:** `src/actions/cms/collection-entry-actions.ts`

Added new action `getCollectionEntryRPC`:
- Calls the `get_collection_entry` RPC function
- Handles authentication and authorization
- Verifies tenant ownership
- Returns the formatted collection entry data

### 4. Page Component

**File:** `src/app/dashboard/(cms)/collections/[collectionId]/entries/[entryId]/page.tsx`

Simplified the page component to match the page content workflow:
- Removed dependency on `getCollectionWithSchemaRPC` and `getCollectionRPC`
- Now uses single `getCollectionEntryRPC` call
- Performs the same field flattening as the page content page
- Passes pre-processed data to CollectionContentEditor

**Before:**
- Called multiple RPCs
- Passed raw collection and entry data
- Let client component do all the transformation

**After:**
- Single RPC call
- Pre-processes fields on the server
- Passes ready-to-use data to client

### 5. Client Component

**File:** `src/components/cms/collections/CollectionContentEditor.tsx`

Massively simplified to mirror PageContentEditor:
- Removed all data transformation logic
- Removed dependency on `CollectionWithSchema` and `CollectionEntryWithItems` types
- Now receives pre-processed `RPCCollectionEntryResponse` and `originalFields`
- Props changed from:
  ```typescript
  {
    collection: CollectionWithSchema;
    entry: CollectionEntryWithItems;
    collectionId: string;
    entryId: string;
  }
  ```
  to:
  ```typescript
  {
    entryId: string;
    collectionId: string;
    existingContent: RPCCollectionEntryResponse;
    originalFields: { id: string; type: string; content: any; content_field_id: string | null; collection_id?: string | null }[];
  }
  ```

**Removed:**
- 60+ lines of client-side data transformation
- `useMemo` for transformedContent
- `useMemo` for originalFields
- Complex schema-to-content mapping logic

**Kept:**
- Entry name editing functionality
- ContentEditor integration
- Navigation and UI structure

## Benefits

1. **Consistency**: Collection entry editing now works exactly like page content editing
2. **Performance**: Data transformation happens on the server, reducing client-side work
3. **Maintainability**: One source of truth for data structure (RPC function)
4. **Simplicity**: Client components are now simpler and easier to understand
5. **Type Safety**: Better type definitions with `RPCCollectionEntryResponse`

## Migration Steps

1. Run the SQL migration file: `create_get_collection_entry_rpc.sql`
2. Verify the functions are created in your database
3. The code changes are already in place and will work once the DB functions are created
4. Test by editing a collection entry to ensure everything works as expected

## Testing Checklist

- [ ] Can view collection entry editor page
- [ ] Entry name displays correctly
- [ ] All fields from schema are visible
- [ ] Existing content loads correctly
- [ ] Can edit field content
- [ ] Can save changes
- [ ] Nested section fields work correctly
- [ ] Reference fields to collections work
- [ ] Entry name can be updated

## Comparison with get_page

| Feature | get_page | get_collection_entry |
|---------|----------|---------------------|
| Main table | cms_pages | cms_collection_entries |
| Content table | cms_content_fields | cms_collections_items |
| Join key | page_id | cms_collection_entry_id |
| Helper function | build_schema_fields_with_content | build_schema_fields_with_collection_items |
| Response type | RPCPageResponse | RPCCollectionEntryResponse |
| Includes slug | Yes | No |
| Includes status | Yes | No |
| Includes website_id | Yes | No (via collection) |
| Includes collection info | No | Yes |

## Notes

- The RPC functions handle both cases where content exists and where it doesn't yet
- Security is enforced through tenant ownership checks
- The functions use `SECURITY DEFINER` to run with elevated privileges but verify ownership first
- Recursive field handling supports unlimited nesting depth


