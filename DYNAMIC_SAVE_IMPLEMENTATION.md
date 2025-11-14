# Dynamic Save Function Implementation Summary

## Overview

This document summarizes the changes made to implement dynamic save functionality in the ContentEditor, allowing it to work with pages, collections, and future content types (like blogs).

## Problem Statement

The `useContentEditorStore` previously hardcoded the `savePageContent` function, making it impossible to use the ContentEditor for other content types like collection entries or blogs.

## Solution

Implemented a callback-based architecture where the save function is passed as a prop and configured in the store, making the ContentEditor fully reusable across different content types.

## Files Modified

### 1. `/src/stores/useContentEditorStore.ts`

**Changes:**
- Added `SaveContentFunction` type export
- Added `saveFn` state property to store the save function
- Added `setSaveFunction()` method to configure the save function
- Updated `saveContent()` to use the dynamic `saveFn` instead of hardcoded `savePageContent`
- Added validation to ensure save function is configured before saving
- Removed direct import of `savePageContent`
- Updated `onSaveCallback` signature for clarity (now doesn't receive updatedFields)

**Key additions:**
```typescript
export type SaveContentFunction = (updatedFields: string) => Promise<{ 
  success: boolean; 
  message?: string; 
  error?: string 
}>;

// In state:
saveFn?: SaveContentFunction;

// New method:
setSaveFunction: (saveFn: SaveContentFunction) => void;
```

### 2. `/src/components/cms/content-editor/ContentEditor.tsx`

**Changes:**
- Added `saveFn` as a required prop
- Updated `onSave` prop to not receive parameters (simpler API)
- Added `useEffect` hook to set save function in store when component mounts
- Added import for `SaveContentFunction` type

**Key changes:**
```typescript
interface ContentEditorProps {
  // ... other props
  saveFn: SaveContentFunction; // NEW: Required save function
  onSave?: () => void | Promise<void>; // CHANGED: No longer receives updatedFields
}
```

### 3. `/src/actions/cms/schema-content-actions.ts`

**Changes:**
- Updated `savePageContent` return type to be explicit
- Changed error handling from throwing errors to returning error responses
- Made function compatible with `SaveContentFunction` type

**Key changes:**
```typescript
export async function savePageContent(
  updatedFields: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  // ... implementation
  // Now returns errors instead of throwing
  return { success: false, error: "..." };
}
```

### 4. `/src/actions/cms/collection-entry-actions.ts`

**Changes:**
- Added new `createCollectionEntrySaveFunction(entryId: string)` wrapper function
- This function returns a `SaveContentFunction` that calls `saveCollectionEntryContent`
- Provides consistent interface for use with ContentEditor

**Key additions:**
```typescript
export function createCollectionEntrySaveFunction(entryId: string) {
  return async (updatedFieldsString: string): Promise<{ 
    success: boolean; 
    message?: string; 
    error?: string 
  }> => {
    // Parse and save collection entry content
  };
}
```

### 5. `/src/components/cms/pages/PageContentEditor.tsx`

**Changes:**
- Added import for `savePageContent`
- Added `saveFn={savePageContent}` prop to ContentEditor

**Key additions:**
```typescript
import { savePageContent } from "@/actions/cms/schema-content-actions";

<ContentEditor
  // ... other props
  saveFn={savePageContent}
  onSave={handleSave}
/>
```

### 6. `/src/components/cms/collections/CollectionContentEditor.tsx`

**Changes:**
- Added import for `createCollectionEntrySaveFunction`
- Created memoized save function using `useMemo`
- Added `saveFn={saveFn}` prop to ContentEditor

**Key additions:**
```typescript
import { createCollectionEntrySaveFunction } from "@/actions/cms/collection-entry-actions";

const saveFn = useMemo(() => createCollectionEntrySaveFunction(entryId), [entryId]);

<ContentEditor
  // ... other props
  saveFn={saveFn}
  onSave={handleSave}
/>
```

## New Files Created

### 1. `/CONTENT_EDITOR_USAGE.md`

Comprehensive guide for using the ContentEditor with different content types, including:
- Architecture overview
- Usage examples for pages and collections
- Future implementation guide for blogs
- Props reference
- Implementation guidelines
- Best practices
- Troubleshooting

## Architecture Benefits

### 1. **Reusability**
The ContentEditor can now be used for any content type by simply providing a different save function.

### 2. **Separation of Concerns**
- ContentEditor: UI and state management
- Save functions: Business logic for saving specific content types
- Callbacks: Side effects after saving (like navigation)

### 3. **Type Safety**
The `SaveContentFunction` type ensures all save functions follow the same contract.

### 4. **Extensibility**
Adding support for new content types (blogs, products, etc.) only requires:
1. Creating a new save function
2. Passing it to ContentEditor
No changes to the store or ContentEditor component needed!

### 5. **Testability**
Save functions can be easily mocked or stubbed for testing.

## Migration Path for Future Content Types

To add support for a new content type (e.g., blogs):

1. **Create save function:**
```typescript
// @/actions/cms/blog-actions.ts
export async function saveBlogContent(
  updatedFieldsString: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  // Implementation
}
```

2. **Create editor component:**
```typescript
// @/components/cms/blogs/BlogContentEditor.tsx
import { saveBlogContent } from "@/actions/cms/blog-actions";

export function BlogContentEditor({ blogId, existingContent, originalFields }) {
  return (
    <ContentEditor
      pageId={blogId}
      existingContent={existingContent}
      originalFields={originalFields}
      saveFn={saveBlogContent}
    />
  );
}
```

## Breaking Changes

### For Components Using ContentEditor

**Before:**
```typescript
<ContentEditor
  pageId={pageId}
  existingContent={existingContent}
  originalFields={originalFields}
  onSave={handleSave} // Optional
/>
```

**After:**
```typescript
<ContentEditor
  pageId={pageId}
  existingContent={existingContent}
  originalFields={originalFields}
  saveFn={savePageContent} // NEW: Required
  onSave={handleSave} // Optional, no longer receives parameters
/>
```

## Testing Recommendations

1. **Test page content saving** - Verify pages still save correctly
2. **Test collection entry saving** - Verify collection entries save correctly
3. **Test error handling** - Verify errors are displayed properly
4. **Test unsaved changes tracking** - Verify the delta tracking still works
5. **Test callbacks** - Verify `onSave` callback is called after successful save

## Performance Considerations

- Using `useMemo` for save functions prevents unnecessary re-renders
- The store only calls the save function when there are actual changes
- Delta tracking ensures only modified fields are sent to the server

## Security Considerations

- Save functions should always verify authentication
- Save functions should check tenant ownership
- Field validation should happen in the save functions
- Content formatting should sanitize user input

## Future Enhancements

Potential improvements for future iterations:

1. **Optimistic updates**: Update UI immediately and rollback on error
2. **Batch saving**: Group multiple rapid saves into one request
3. **Conflict detection**: Detect if content was modified by another user
4. **Auto-save**: Periodically save changes automatically
5. **Undo/Redo**: Implement undo/redo functionality
6. **Save queue**: Queue saves when offline and sync when online

## Conclusion

This implementation successfully makes the ContentEditor dynamic and reusable across different content types while maintaining type safety and a clean API. The architecture is extensible and follows React best practices.

