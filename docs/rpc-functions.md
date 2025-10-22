# Database RPC Functions

## Overview

This document describes the custom PostgreSQL functions that can be called via Supabase RPC for optimized database queries.

## get_collection_with_schema

### Purpose

Fetches a collection with its full schema (including sections and fields) in a single database round-trip. This function combines the functionality of `getCollectionById` and `getSchemaById` into one optimized query.

### Benefits

- **Performance**: Reduces from 2 database round-trips to 1
- **Atomicity**: Ensures data consistency within a single transaction
- **Efficiency**: All joins and data fetching happen server-side in PostgreSQL
- **Reduced Latency**: Especially beneficial for remote databases or high-latency connections

### Function Signature

```sql
get_collection_with_schema(
  p_collection_id uuid,
  p_tenant_id uuid
) returns jsonb
```

### Parameters

- `p_collection_id` (uuid): The ID of the collection to fetch
- `p_tenant_id` (uuid): The tenant ID for access control validation

### Return Value

Returns a JSONB object with the following structure:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Collection Name",
    "description": "Description",
    "schema_id": "uuid",
    "website_id": "uuid",
    "created_by": "uuid",
    "created_at": "timestamp",
    "cms_schemas": {
      "id": "uuid",
      "name": "Schema Name",
      "description": "Description",
      "template": false,
      "created_by": "uuid",
      "tenant_id": "uuid",
      "created_at": "timestamp",
      "updated_at": "timestamp",
      "cms_schema_sections": [
        {
          "id": "uuid",
          "name": "Section Name",
          "description": "Description",
          "order": 0,
          "schema_id": "uuid",
          "created_at": "timestamp",
          "updated_at": "timestamp",
          "cms_schema_fields": [
            {
              "id": "uuid",
              "name": "Field Name",
              "type": "text",
              "required": true,
              "default_value": null,
              "validation": null,
              "order": 0,
              "parent_field_id": null,
              "schema_section_id": "uuid",
              "created_at": "timestamp",
              "updated_at": "timestamp"
            }
          ]
        }
      ]
    }
  }
}
```

On error:

```json
{
  "success": false,
  "error": "Error message"
}
```

### Security

- Uses `SECURITY INVOKER` - runs with the permissions of the calling user
- Sets `search_path = ''` to prevent schema injection attacks
- Uses fully qualified table names (`public.cms_collections`, etc.)
- Validates tenant access through the `cms_websites` table
- Raises exceptions for unauthorized access or missing data

### Usage in TypeScript

#### Using the wrapper function (recommended)

```typescript
import { getCollectionWithSchemaRPC } from "@/actions/cms/collection-rpc-actions";

// In your server component or action
const result = await getCollectionWithSchemaRPC(collectionId);

if (!result.success) {
  console.error(result.error);
  return;
}

const collection = result.data;
console.log(collection.name);
console.log(collection.cms_schemas?.cms_schema_sections);
```

#### Direct RPC call

```typescript
import { createClient } from "@/lib/supabase/supabaseServerClient";
import { getActiveTenantId } from "@/server/utils";

const supabase = await createClient();
const tenantId = await getActiveTenantId();

const { data, error } = await supabase.rpc('get_collection_with_schema', {
  p_collection_id: collectionId,
  p_tenant_id: tenantId,
});

if (error || !data.success) {
  console.error(error || data.error);
  return;
}

const collection = data.data;
```

### Migration

The function is defined in:
```
supabase/migrations/get_collection_with_schema.sql
```

To apply the migration:

1. **For Supabase CLI:**
   ```bash
   supabase db push
   ```

2. **For Supabase Dashboard:**
   - Copy the contents of the migration file
   - Go to SQL Editor in your Supabase dashboard
   - Paste and execute the SQL

3. **Using Cursor AI Supabase integration:**
   ```typescript
   // The function can be applied directly through the MCP tools
   await mcp_supabase_apply_migration({
     project_id: "your-project-id",
     name: "get_collection_with_schema",
     query: "-- SQL content here --"
   });
   ```

### Performance Comparison

#### Before (2 separate queries):
```typescript
// Query 1: Get collection with basic schema info
const collectionResult = await getCollectionById(collectionId);
// ~50-100ms

// Query 2: Get full schema with sections and fields  
const schemaResult = await getSchemaById(collection.schema_id);
// ~50-100ms

// Total: ~100-200ms + network latency for 2 round-trips
```

#### After (1 RPC call):
```typescript
// Single query: Get everything at once
const result = await getCollectionWithSchemaRPC(collectionId);
// ~50-100ms

// Total: ~50-100ms + network latency for 1 round-trip
```

**Expected improvement:** ~40-60% reduction in total query time, especially significant with higher network latency.

### Error Handling

The function handles the following error cases:

1. **Collection not found**: Returns error message
2. **Access denied**: Returns error when tenant_id doesn't match
3. **Schema not found**: Returns error when schema exists but is inaccessible
4. **No schema**: Returns collection without schema data when schema_id is null

All errors are caught and returned in the response object rather than throwing exceptions to the client.

### Best Practices

1. **Always check the success flag** in the response before accessing data
2. **Use the TypeScript wrapper function** for type safety and automatic tenant handling
3. **Cache results** if the data is used multiple times in a request
4. **Handle the no-schema case** when collection.schema_id is null

### Related Functions

- `getCollectionById()` - Original function for fetching collection (can still be used for simple cases)
- `getSchemaById()` - Original function for fetching schema details
- `getCollectionsByWebsite()` - Lists all collections for a website

### Future Improvements

Potential optimizations for future versions:

- Add pagination for schemas with many sections/fields
- Add option to fetch only specific sections or fields
- Cache frequently accessed collections
- Add field-level permissions checking

