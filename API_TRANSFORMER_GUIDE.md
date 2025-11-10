# API Response Transformation Guide

## The Problem

Your CMS API returns data in a **raw database structure** with metadata:

```typescript
{
  "success": true,
  "data": {
    "id": "...",
    "slug": "/",
    "sections": [
      {
        "id": "...",
        "name": "Hero",
        "order": 0,
        "fields": [
          {
            "id": "...",
            "name": "Title",
            "type": "text",
            "order": 0,
            "content": "Onekingdom",
            "field_key": "title"
          }
        ]
      }
    ]
  }
}
```

But the generated TypeScript types represent a **clean, flattened structure**:

```typescript
interface PageContent {
  id: string;
  slug: string;
  sections: {
    Hero: HeroSection;
    About: AboutSection;
  };
}

interface HeroSection {
  title: string;
  subtitle?: string;
}
```

## The Solution

Use the `transformApiResponse` utility to convert between the two structures.

### Step 1: Copy Generated Types

Generate types from the Type Generator and save them to `types/cms.ts`:

```typescript
// types/cms.ts

interface StreamersEntry {
  id: string;
  streamer_image?: string;
  streamer_tag?: string;
  socials?: Socials;
  function?: string;
}

interface Socials {
  twitch?: { text: string; url: string; variant?: string };
  tiktok?: { text: string; url: string; variant?: string };
}

interface HeroSection {
  sub_title?: string;
  title?: string;
  background_image?: string;
}

interface AboutSection {
  section_title?: string;
  rich_text?: string;
  discord_button?: { text: string; url: string; variant?: string };
}

interface StreamersSection {
  section_title?: string;
  streamers?: StreamersEntry[];
}

export interface PageContent {
  id: string;
  slug: string;
  sections: {
    Hero: HeroSection;
    About: AboutSection;
    Streamers: StreamersSection;
  };
}

export type SectionContent = PageContent['sections'];
```

### Step 2: Copy the Transformer

Copy `/src/lib/api-transformer.ts` to your client project.

### Step 3: Use in Your Code

```typescript
import { transformApiResponse } from '@/lib/api-transformer';
import { PageContent } from '@/types/cms';

async function getPageContent(slug: string) {
  // Fetch raw data from API
  const response = await fetch(`/api/page-content?slug=${slug}`);
  const rawData = await response.json();
  
  // Transform to typed structure
  const pageData = transformApiResponse<PageContent['sections']>(rawData);
  
  // Now you have full TypeScript autocomplete!
  return pageData;
}

// Usage
const page = await getPageContent('/');
console.log(page.sections.Hero.title); // ✅ Type-safe!
console.log(page.sections.Streamers.streamers); // ✅ Array of StreamersEntry
```

## How the Transformer Works

The transformer does three main things:

### 1. Flattens Section Arrays → Object

**Raw:**
```json
{
  "sections": [
    { "name": "Hero", "fields": [...] },
    { "name": "About", "fields": [...] }
  ]
}
```

**Transformed:**
```typescript
{
  sections: {
    Hero: { ... },
    About: { ... }
  }
}
```

### 2. Extracts Content from Fields

**Raw:**
```json
{
  "fields": [
    {
      "field_key": "title",
      "content": "Onekingdom"
    }
  ]
}
```

**Transformed:**
```typescript
{
  title: "Onekingdom"
}
```

### 3. Processes Reference Fields

**Raw:**
```json
{
  "field_key": "streamers",
  "type": "reference",
  "content": {
    "entries": [
      {
        "id": "...",
        "name": "Ron0x",
        "items": [...]
      }
    ]
  }
}
```

**Transformed:**
```typescript
{
  streamers: [
    {
      id: "...",
      name: "Ron0x",
      streamer_image: "...",
      socials: { ... }
    }
  ]
}
```

## Advanced Usage

### Custom Transformations

If you need custom logic, extend the transformer:

```typescript
import { transformApiResponse, RawApiResponse } from '@/lib/api-transformer';
import { PageContent } from '@/types/cms';

function transformWithDefaults(rawData: RawApiResponse): PageContent {
  const transformed = transformApiResponse<PageContent['sections']>(rawData);
  
  // Add custom logic
  if (!transformed.sections.Hero.title) {
    transformed.sections.Hero.title = 'Default Title';
  }
  
  return transformed as PageContent;
}
```

### Server-Side Transformation

Transform on the server for better performance:

```typescript
// app/api/page-content/route.ts
import { transformApiResponse } from '@/lib/api-transformer';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  
  // Fetch raw data from database
  const rawData = await fetchFromDatabase(slug);
  
  // Transform before sending to client
  const transformed = transformApiResponse(rawData);
  
  return NextResponse.json(transformed);
}
```

### React Hook

Create a custom hook for fetching and transforming:

```typescript
import { useState, useEffect } from 'react';
import { transformApiResponse } from '@/lib/api-transformer';
import { PageContent } from '@/types/cms';

export function usePageContent(slug: string) {
  const [data, setData] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch(`/api/page-content?slug=${slug}`)
      .then(res => res.json())
      .then(raw => {
        const transformed = transformApiResponse<PageContent['sections']>(raw);
        setData(transformed as PageContent);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [slug]);

  return { data, loading, error };
}

// Usage in component
function HomePage() {
  const { data, loading } = usePageContent('/');
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>{data?.sections.Hero.title}</h1>
      <p>{data?.sections.Hero.sub_title}</p>
    </div>
  );
}
```

## Type Safety Benefits

With the transformer + generated types, you get:

✅ **Autocomplete** - Your IDE suggests available fields
✅ **Type Checking** - Catch errors at compile time
✅ **Refactoring** - Rename/change fields safely
✅ **Documentation** - Types serve as inline docs
✅ **Validation** - TypeScript ensures structure matches

## Troubleshooting

### Field Missing in Transformed Data

**Problem:** A field exists in raw data but is `undefined` after transformation.

**Solution:** Check that the `field_key` matches the type definition.

```typescript
// In raw data
{ "field_key": "sub_title", "content": "Welcome" }

// In type definition (must match!)
interface HeroSection {
  sub_title?: string;  // ✅ Matches field_key
}
```

### Reference Field Returns Wrong Type

**Problem:** Reference field is typed as single object but API returns array.

**Solution:** Check if your field allows multiple entries. Update type to array:

```typescript
// Before
interface StreamersSection {
  streamers?: StreamersEntry;  // ❌ Wrong
}

// After
interface StreamersSection {
  streamers?: StreamersEntry[];  // ✅ Correct
}
```

Then regenerate types with the updated schema.

### Nested Section Not Transforming

**Problem:** Nested section fields (like `socials` inside `StreamersEntry`) aren't transforming.

**Solution:** The transformer handles this automatically. Make sure the `field_type` is `"section"` in the raw data:

```json
{
  "name": "socials",
  "field_type": "section",  // ← Must be "section"
  "items": [...]
}
```

## Related Documentation

- [Type Generator README](./TYPE_GENERATOR_README.md)
- [Schema Builder Guide](./README.md)
- [API Integration](./API_KEYS_QUICK_START.md)


