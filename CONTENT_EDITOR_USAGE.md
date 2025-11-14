# ContentEditor Dynamic Save Function Guide

## Overview

The `ContentEditor` component now supports dynamic save functions, making it reusable across different content types (pages, collections, blogs, etc.). This guide explains how to use the ContentEditor with different content types.

## Architecture

### Core Components

1. **`useContentEditorStore`** - Zustand store that manages content state and saving
2. **`SaveContentFunction`** - Type definition for save functions
3. **`ContentEditor`** - React component that renders the content editor UI

### Save Function Type

```typescript
export type SaveContentFunction = (updatedFields: string) => Promise<{ 
  success: boolean; 
  message?: string; 
  error?: string 
}>;
```

## Usage Examples

### 1. Pages (Schema-based Content)

**Save Function:** `savePageContent` from `@/actions/cms/schema-content-actions`

**Example:**

```typescript
import { ContentEditor } from "@/components/cms/content-editor/ContentEditor";
import { savePageContent } from "@/actions/cms/schema-content-actions";

export function PageContentEditor({ pageId, existingContent, originalFields }) {
  return (
    <ContentEditor
      pageId={pageId}
      existingContent={existingContent}
      originalFields={originalFields}
      saveFn={savePageContent}
      onSave={async () => {
        // Optional: Called after successful save
        router.refresh();
      }}
    />
  );
}
```

**How it works:**
- Updates `cms_content_fields` table
- Uses `schema_field_id` or `content_field_id` to identify fields
- Revalidates `/dashboard/websites` path

### 2. Collection Entries

**Save Function:** `createCollectionEntrySaveFunction(entryId)` from `@/actions/cms/collection-entry-actions`

**Example:**

```typescript
import { ContentEditor } from "@/components/cms/content-editor/ContentEditor";
import { createCollectionEntrySaveFunction } from "@/actions/cms/collection-entry-actions";
import { useMemo } from "react";

export function CollectionContentEditor({ entryId, existingContent, originalFields }) {
  // Create save function for this specific entry
  const saveFn = useMemo(() => createCollectionEntrySaveFunction(entryId), [entryId]);

  return (
    <ContentEditor
      pageId={entryId}
      existingContent={existingContent}
      originalFields={originalFields}
      saveFn={saveFn}
      onSave={async () => {
        // Optional: Called after successful save
        router.refresh();
      }}
    />
  );
}
```

**How it works:**
- Updates `cms_collections_items` table
- Uses `item_id` to identify existing content or creates new items
- Revalidates collection entries paths

### 3. Future: Blog Posts (Example)

When implementing blogs, follow this pattern:

**Step 1: Create Save Function**

```typescript
// @/actions/cms/blog-actions.ts

export async function saveBlogContent(
  updatedFieldsString: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const updatedFields = JSON.parse(updatedFieldsString);
    
    // Your blog-specific save logic here
    // e.g., update cms_blog_content table
    
    return { success: true, message: "Blog content saved successfully" };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to save blog content" 
    };
  }
}
```

**Step 2: Use in Component**

```typescript
import { ContentEditor } from "@/components/cms/content-editor/ContentEditor";
import { saveBlogContent } from "@/actions/cms/blog-actions";

export function BlogContentEditor({ blogId, existingContent, originalFields }) {
  return (
    <ContentEditor
      pageId={blogId}
      existingContent={existingContent}
      originalFields={originalFields}
      saveFn={saveBlogContent}
      onSave={async () => {
        router.refresh();
      }}
    />
  );
}
```

## Props Reference

### ContentEditor Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `pageId` | `string` | Yes | Unique identifier for the content being edited |
| `existingContent` | `RPCPageResponse` | Yes | The content structure with sections and fields |
| `originalFields` | `FieldWithValue[]` | Yes | Array of flattened fields with their original values |
| `header` | `ReactNode` | No | Custom header component |
| `saveFn` | `SaveContentFunction` | Yes | Function that handles saving the content |
| `onSave` | `() => void \| Promise<void>` | No | Callback executed after successful save |
| `expandedSections` | `Record<string, boolean>` | No | State for section expansion |
| `setExpandedSections` | `(sections: Record<string, boolean>) => void` | No | Setter for section expansion |

### FieldWithValue Interface

```typescript
interface FieldWithValue {
  id: string;              // schema field ID
  type: string;            // field type (text, richtext, image, etc.)
  content: any;            // field content
  content_field_id?: string | null;  // actual content field ID for updates
  collection_id?: string | null;     // collection id for reference fields
}
```

## Save Function Implementation Guidelines

When creating a new save function, follow these guidelines:

1. **Accept stringified JSON**: The function should accept `updatedFields` as a string
2. **Parse the input**: Parse the string into an array of field objects
3. **Handle authentication**: Check if the user is authenticated
4. **Verify permissions**: Ensure the user has permission to edit the content
5. **Format content**: Use appropriate formatting for each field type
6. **Update database**: Update the appropriate table(s)
7. **Revalidate paths**: Call `revalidatePath()` to refresh cached data
8. **Return consistent format**: Always return `{ success, message?, error? }`
9. **Handle errors gracefully**: Catch errors and return them in the response

## Content Store Methods

### `setSaveFunction(saveFn: SaveContentFunction)`
Sets the function that will be used to save content.

### `setOnSaveCallback(callback?: () => void | Promise<void>)`
Sets an optional callback to be executed after successful save.

### `saveContent()`
Triggers the save operation using the configured save function.

### `setFieldValue(fieldId: string, value: any)`
Updates a field value and tracks it in the delta.

### `getFieldValue(fieldId: string)`
Gets the current value of a field (from updated or original values).

### `resetField(fieldId: string)`
Resets a single field to its original value.

### `resetAllFields()`
Resets all fields to their original values.

## Error Handling

The save function should handle errors gracefully and return them in a consistent format:

```typescript
try {
  // Save logic
  return { success: true, message: "Content saved successfully" };
} catch (error) {
  console.error("Error saving content:", error);
  return { 
    success: false, 
    error: error instanceof Error ? error.message : "Failed to save content" 
  };
}
```

The ContentEditor will:
- Display the error message to the user via toast
- Keep the save button enabled for retry
- Preserve unsaved changes

## Best Practices

1. **Use `useMemo` for save functions**: When creating save functions with parameters (like `entryId`), wrap them in `useMemo` to prevent unnecessary re-renders.

2. **Separate concerns**: Keep the save function focused on saving data. Use `onSave` callback for side effects like navigation or data refresh.

3. **Type safety**: Always use the `SaveContentFunction` type for your save functions.

4. **Consistent field structure**: Ensure your `originalFields` array matches the expected structure with `id`, `type`, `content`, and optional `content_field_id`.

5. **Revalidation**: Always revalidate the appropriate paths after saving to ensure the UI shows fresh data.

## Troubleshooting

### "No save function configured" error
**Cause**: The `saveFn` prop was not passed to ContentEditor  
**Solution**: Ensure you're passing a valid save function to the `saveFn` prop

### Save function not called
**Cause**: No fields have been modified  
**Solution**: This is expected behavior. The store only calls the save function when there are changes.

### Changes not persisting
**Cause**: Save function may not be returning the correct format  
**Solution**: Ensure your save function returns `{ success: boolean, message?: string, error?: string }`

### TypeScript errors
**Cause**: Save function signature doesn't match `SaveContentFunction`  
**Solution**: Ensure your function accepts `(updatedFields: string)` and returns the correct Promise type

