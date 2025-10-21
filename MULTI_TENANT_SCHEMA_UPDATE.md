# Multi-Tenant Schema Support Implementation

## Overview
Updated the schema management system to support multi-tenancy by integrating with the active tenant cookie system.

## Changes Made

### 1. Type Updates (`src/types/cms.ts`)

**Schema Interface:**
```typescript
export interface Schema {
  id: string;
  name: string;
  description?: string | null;
  template: boolean;
  created_by: string;
  tenant_id?: string | null;  // ✅ Added
  created_at?: string;
  updated_at?: string;
  cms_schema_sections?: SchemaSection[];
}
```

**SupabaseSchemaWithRelations Type:**
```typescript
export type SupabaseSchemaWithRelations = {
  id: string;
  name: string;
  description: string | null;
  template: boolean;
  created_by: string;
  tenant_id: string | null;  // ✅ Added
  created_at: string | null;
  updated_at: string | null;
  cms_schema_sections: {...}
}
```

### 2. Server Actions (`src/actions/cms/schema-actions.ts`)

**New Helper Function:**
```typescript
async function getActiveTenantId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("active-tenant")?.value || null;
}
```

**Updated Functions:**

#### `createSchema()`
- ✅ Retrieves active tenant ID from cookies
- ✅ Validates tenant ID is present
- ✅ Includes `tenant_id` when inserting schema
- ✅ Returns error if no active tenant selected

#### `getAllSchemas()`
- ✅ Retrieves active tenant ID from cookies
- ✅ Filters schemas by `tenant_id`
- ✅ Only returns schemas belonging to the active tenant
- ✅ Returns error if no active tenant selected

#### `getSchemaById()`
- ✅ Retrieves active tenant ID from cookies
- ✅ Filters by both `id` AND `tenant_id`
- ✅ Prevents accessing schemas from other tenants
- ✅ Returns error if no active tenant selected

#### `updateSchema()`
- ✅ Retrieves active tenant ID from cookies
- ✅ Filters by both `id` AND `tenant_id`
- ✅ Prevents updating schemas from other tenants
- ✅ Returns error if no active tenant selected

#### `deleteSchema()`
- ✅ Retrieves active tenant ID from cookies
- ✅ Filters by both `id` AND `tenant_id`
- ✅ Prevents deleting schemas from other tenants
- ✅ Returns error if no active tenant selected

## How It Works

### Cookie-Based Tenant Selection

The system uses the `active-tenant` cookie (managed by `use-active-tenant.tsx`) to determine which tenant's data to access:

1. **Client Side:** User selects tenant using `useActiveTenant()` hook
2. **Cookie Storage:** Tenant ID is stored in `active-tenant` cookie
3. **Server Side:** Actions read the cookie to filter/create tenant-specific data

### Security Features

✅ **Tenant Isolation:** Users can only access schemas within their active tenant
✅ **Validation:** All operations validate tenant ID is present
✅ **Row-Level Security:** Database queries filter by `tenant_id`
✅ **Cross-Tenant Protection:** Cannot update/delete schemas from other tenants

### Error Handling

All actions now return appropriate errors when:
- No active tenant is selected
- User tries to access schemas from another tenant
- Authentication or authorization fails

## Database Schema

The `cms_schemas` table includes:
- `tenant_id` column (string, nullable, foreign key to `tenants`)
- Foreign key constraint: `cms_schemas_tenant_id_fkey`
- Allows null for global/system schemas

## Benefits

1. **Multi-Tenant Isolation:** Each tenant has their own set of schemas
2. **Automatic Filtering:** No need to manually filter by tenant in components
3. **Security:** Server-side enforcement prevents cross-tenant access
4. **Flexibility:** Nullable tenant_id allows for global/shared templates
5. **Seamless UX:** Works with existing tenant switcher UI

## Usage

### Creating a Schema
```typescript
// Automatically uses active tenant from cookie
const result = await createSchema({
  name: "Blog Post",
  description: "Schema for blog posts",
  template: false
});
// Schema created with current tenant_id
```

### Fetching Schemas
```typescript
// Only returns schemas for active tenant
const result = await getAllSchemas();
// result.data contains only current tenant's schemas
```

### Switching Tenants
```typescript
// In client component
const { setActiveTenant, availableTenants } = useActiveTenant();

// Switch tenant
setActiveTenant(availableTenants[1]);

// Next page load/refresh will show new tenant's schemas
```

## Migration Notes

### Existing Schemas
- Existing schemas may have `null` tenant_id
- Consider running a migration to assign them to appropriate tenants
- Or use them as global templates

### Database Migration Example
```sql
-- Assign existing schemas to a default tenant
UPDATE cms_schemas 
SET tenant_id = 'default-tenant-id' 
WHERE tenant_id IS NULL;

-- Or keep some as global templates
UPDATE cms_schemas 
SET tenant_id = NULL, template = true 
WHERE name IN ('Global Template 1', 'Global Template 2');
```

## Testing Checklist

- [ ] Create schema with tenant A
- [ ] Switch to tenant B
- [ ] Verify schema from tenant A is not visible
- [ ] Create schema with tenant B
- [ ] Switch back to tenant A
- [ ] Verify only tenant A schemas are visible
- [ ] Attempt to access tenant B schema by ID from tenant A (should fail)
- [ ] Update schema in tenant A
- [ ] Delete schema in tenant A
- [ ] Verify operations don't affect tenant B

## Future Enhancements

Potential improvements:
- [ ] Shared/Global templates accessible by all tenants
- [ ] Schema sharing between specific tenants
- [ ] Schema marketplace/library
- [ ] Tenant-level schema permissions
- [ ] Schema duplication across tenants
- [ ] Tenant usage analytics per schema

