# TypeScript Type Generator

The TypeScript Type Generator is a powerful feature that automatically generates type-safe TypeScript definitions for your CMS schemas. This allows you to use your content with full autocomplete and type safety in your client websites.

## Features

- 🎯 **Automatic Type Generation**: Generate TypeScript types directly from your CMS schemas
- 🔄 **Field Type Mapping**: Automatically maps CMS field types to appropriate TypeScript types
- 📦 **Nested Support**: Handles nested sections and complex field structures
- 🔗 **Collection Integration**: Reference fields automatically get proper collection types
- 🔁 **Recursive Reference Resolution**: Automatically resolves deeply nested collection references
- 🔀 **API Transformer**: Utility to convert raw API responses to typed structures
- 📋 **Copy & Download**: Easy copy-to-clipboard or download as `.ts` file
- 🎨 **Clean Output**: Minimal, focused type definitions without unnecessary comments

## Accessing the Type Generator

There are two ways to access the Type Generator:

### 1. From the Dashboard (Recommended)
Navigate to **Dashboard → Type Generator** in the sidebar to see all your schemas and generate types for any of them.

### 2. From the Schema Builder
When editing a schema, click the **"Generate Types"** button in the schema header (next to the Settings button).

## Field Type Mappings

The generator maps CMS field types to TypeScript types as follows:

| CMS Field Type | TypeScript Type | Example |
|---------------|-----------------|---------|
| `text` | `string` | `title: string` |
| `richtext` | `string` | `content: string` |
| `number` | `number` | `price: number` |
| `boolean` | `boolean` | `published: boolean` |
| `date` | `string` | `publishedAt: string` (ISO date) |
| `image` | `string` | `imageUrl: string` (URL) |
| `video` | `string` | `videoId: string` |
| `reference` | Collection type | `author: AuthorEntry` (see below) |
| `button` | `{ text: string; url: string; variant?: string }` | Button object |
| `section` | Nested interface | Generates a nested type |

### Collection References

When a field is of type `reference` and is linked to a collection, the generator automatically:
1. Fetches the collection's schema
2. Generates a typed interface for that collection (e.g., `AuthorEntry`, `ProductEntry`)
3. Uses that interface as the field type instead of `string`

This provides full type safety when working with referenced collection entries!

## Usage Example

### 1. Generate Types

From the Type Generator page, select your schema and click "Generate Types". You'll see something like:

```typescript
/**
 * TypeScript types for Blog Post Schema
 * Generated on: 2024-01-15T10:30:00.000Z
 * 
 * Usage:
 * ```typescript
 * import { PageContent } from './types';
 * 
 * const response = await supabase.rpc('get_page_content', {
 *   page_id_param: 'your-page-id',
 *   website_id_param: 'your-website-id'
 * });
 * 
 * const pageData: PageContent = response.data[0];
 * ```
 */

  interface AuthorEntry {
    id: string;
    name: string;
    bio?: string;
    avatar?: string;
  }

  interface HeroSection {
    title: string;
    subtitle?: string;
    background_image: string;
    cta: CtaButton;
  }

  interface CtaButton {
    text: string;
    url: string;
    variant?: string;
  }

  interface ContentSection {
    title: string;
    author: AuthorEntry;
    content: string;
  }

  export interface PageContent {
    id: string;
    slug: string;
    sections: {
      hero: HeroSection;
      content: ContentSection;
    };
  }

  export type SectionContent = PageContent['sections'];
```

### 2. Copy to Your Project

Create a new file in your client project (e.g., `types/cms.ts`) and paste the generated types.

### 3. Use in Your Code

```typescript
import { createClient } from '@supabase/supabase-js';
import { PageContent } from './types/cms';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function fetchPageContent(pageId: string, websiteId: string) {
  const { data, error } = await supabase.rpc('get_page_content', {
    page_id_param: pageId,
    website_id_param: websiteId,
  });

  if (error) throw error;
  
  // Now you have full TypeScript autocomplete!
  const pageData: PageContent = data[0];
  
  // Access typed content
  console.log(pageData.sections.hero.title); // ✅ Type-safe!
  console.log(pageData.sections.hero.subtitle); // ✅ Optional field
  console.log(pageData.sections.content.author.name); // ✅ Collection reference is typed!
  // console.log(pageData.sections.hero.invalid); // ❌ TypeScript error!
  
  return pageData;
}
```

## Benefits

### 🛡️ Type Safety
Catch errors at compile time instead of runtime:

```typescript
// ❌ TypeScript will catch this error
const title: number = pageData.sections.hero.title; 
// Error: Type 'string' is not assignable to type 'number'
```

### 💡 Autocomplete
Get intelligent autocomplete in your IDE:

```typescript
pageData.sections. // Your IDE shows: hero, content, footer, etc.
pageData.sections.hero. // Your IDE shows: title, subtitle, background_image, cta
```

### 🔗 Collection References
Reference fields automatically resolve to typed collection entries:

```typescript
interface AuthorEntry {
  id: string;
  name: string;
  bio?: string;
  avatar?: string;
}

interface ContentSection {
  title: string;
  author: AuthorEntry; // Fully typed collection reference!
  content: string;
}

// Use it with full type safety
function renderAuthor(author: AuthorEntry) {
  return `${author.name} - ${author.bio}`;
}
```

### 🔄 Refactoring
When you change your schema and regenerate types, TypeScript will show you everywhere in your code that needs updating.

## Best Practices

1. **Version Control**: Check generated types into version control
2. **Regenerate After Changes**: Regenerate types whenever you modify your schema
3. **Central Location**: Keep all CMS types in a single file (e.g., `types/cms.ts`)
4. **Import Once**: Import types where needed, don't duplicate them
5. **Use Helper Types**: Leverage the generated `SectionContent` type for section-specific components

## Advanced Usage

### Using Section-Specific Types

```typescript
import { PageContent } from './types/cms';

// Extract just the hero section type
type HeroProps = PageContent['sections']['hero'];

function HeroComponent({ title, subtitle, background_image }: HeroProps) {
  return (
    <div style={{ backgroundImage: `url(${background_image})` }}>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}
```

### Creating Utility Functions

```typescript
import { PageContent } from './types/cms';

function getPageTitle(page: PageContent): string {
  return page.sections.hero?.title || 'Untitled';
}

function hasPublishedContent(page: PageContent): boolean {
  return page.sections.content?.published ?? false;
}
```

## Troubleshooting

### Field Keys Not Valid TypeScript Identifiers

If your field keys contain spaces or special characters, the generator will automatically sanitize them:

- `"Hero Title"` → `hero_title`
- `"CTA-Button"` → `cta_button`
- `"2023 Update"` → `_2023_update` (prefixed with underscore)

### Regenerating Types

Simply open the Type Generator dialog again and click "Generate Types". Copy the new types and replace the old ones in your project.

### Missing Fields

Make sure all fields have a `field_key` set in the schema builder. The generator uses `field_key` for the TypeScript property names.

## API Reference

### RPC Function: `get_page_content`

```sql
get_page_content(page_id_param: string, website_id_param: string)
```

**Returns:**
```typescript
[{
  id: string;
  slug: string;
  sections: Record<string, any>; // Typed by generated interfaces
}]
```

## Important: API Response Transformation

The generated types represent a **clean, flattened structure** for your content. However, your CMS API returns data in a **raw database structure** with metadata (IDs, orders, field arrays, etc.).

**You need to transform the API response** to match the generated types. We provide a utility for this:

📘 **See [API Transformer Guide](./API_TRANSFORMER_GUIDE.md)** for complete instructions on:
- How to transform raw API responses
- Using the provided transformer utility
- Working with reference fields and nested sections
- Creating custom transformations
- React hooks and server-side transformation

**Quick Example:**

```typescript
import { transformApiResponse } from '@/lib/api-transformer';
import { PageContent } from './types/cms';

const response = await fetch('/api/page-content?slug=/');
const rawData = await response.json();

// Transform raw API response to typed structure
const pageData = transformApiResponse<PageContent['sections']>(rawData);

// Now you have full type safety!
console.log(pageData.sections.Hero.title); // ✅ Autocomplete works!
```

## Related Documentation

- [API Transformer Guide](./API_TRANSFORMER_GUIDE.md) - **Start here for API integration**
- [Schema Builder Guide](./README.md)
- [Field Types Reference](./README.md#field-types-reference)
- [API Integration](./API_KEYS_QUICK_START.md)

