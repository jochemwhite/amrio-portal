# Field Key UI Example

## Visual Preview

### Before (without field_key)
```
┌─────────────────────────────────────────┐
│  Add Text Field                         │
├─────────────────────────────────────────┤
│                                         │
│  Field Name *                           │
│  ┌───────────────────────────────────┐  │
│  │ Hero Title                        │  │
│  └───────────────────────────────────┘  │
│  The unique identifier for this field   │
│                                         │
│  ☐ Required Field                       │
│  Make this field mandatory              │
│                                         │
│  Default Value                          │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

### After (with field_key)
```
┌─────────────────────────────────────────┐
│  Add Text Field                         │
├─────────────────────────────────────────┤
│                                         │
│  Field Name *                           │
│  ┌───────────────────────────────────┐  │
│  │ Hero Title                        │  │
│  └───────────────────────────────────┘  │
│  The display name for this field        │
│                                         │
│  Field Key *                         ⭐ NEW │
│  ┌───────────────────────────────────┐  │
│  │ hero_title                        │  │
│  └───────────────────────────────────┘  │
│  Unique programmatic identifier         │
│  (snake_case). Used in code.            │
│                                         │
│  ☐ Required Field                       │
│  Make this field mandatory              │
│                                         │
│  Default Value                          │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

## Auto-formatting Example

As you type, the field_key input automatically formats to snake_case:

| You Type         | Field Key Becomes |
|------------------|-------------------|
| `Hero Title`     | `hero_title`      |
| `CTA Button`     | `cta_button`      |
| `Background IMG` | `background_img`  |
| `Section 1`      | `section_1`       |
| `hero-title`     | `hero_title`      |
| `HERO TITLE`     | `hero_title`      |

## Error Messages

### Empty Field
```
Field Key *
┌───────────────────────────────────┐
│                                   │
└───────────────────────────────────┘
⚠️ Field key is required
```

### Invalid Format (starts with number)
```
Field Key *
┌───────────────────────────────────┐
│ 1_hero_title                      │
└───────────────────────────────────┘
⚠️ Field key must start with a lowercase letter
   and contain only lowercase letters, numbers,
   and underscores
```

### Valid Input
```
Field Key *
┌───────────────────────────────────┐
│ hero_title                        │ ✅
└───────────────────────────────────┘
Unique programmatic identifier (snake_case).
Used in code to access this field.
```

## Real-World Example

### Creating a Hero Section Schema

```
Section: Hero Section

Fields:
1. Heading
   - Field Name: "Hero Heading"
   - Field Key: "hero_heading"
   - Type: Text
   
2. Subheading
   - Field Name: "Subheading"
   - Field Key: "subheading"
   - Type: Text
   
3. CTA Button
   - Field Name: "Call to Action Button"
   - Field Key: "cta_button"
   - Type: Button
   
4. Background Image
   - Field Name: "Background Image"
   - Field Key: "background_image"
   - Type: Image
```

### API Response

```json
{
  "id": "section_123",
  "name": "Hero Section",
  "fields": [
    {
      "id": "field_1",
      "name": "Hero Heading",
      "field_key": "hero_heading",
      "type": "text",
      "content": "Welcome to Our Website"
    },
    {
      "id": "field_2",
      "name": "Subheading",
      "field_key": "subheading",
      "type": "text",
      "content": "We build amazing products"
    },
    {
      "id": "field_3",
      "name": "Call to Action Button",
      "field_key": "cta_button",
      "type": "button",
      "content": {
        "text": "Get Started",
        "url": "/signup"
      }
    },
    {
      "id": "field_4",
      "name": "Background Image",
      "field_key": "background_image",
      "type": "image",
      "content": {
        "url": "https://...",
        "alt": "Hero background"
      }
    }
  ]
}
```

### Using in Frontend Code

```typescript
// Before: Brittle, breaks if names change
const heading = fields.find(f => f.name === 'Hero Heading')?.content;
const cta = fields.find(f => f.name === 'Call to Action Button')?.content;

// After: Stable, reliable
const heading = fields.find(f => f.field_key === 'hero_heading')?.content;
const cta = fields.find(f => f.field_key === 'cta_button')?.content;

// Even better: Create a helper
function getFieldByKey(fields: Field[], key: string) {
  return fields.find(f => f.field_key === key)?.content;
}

const heading = getFieldByKey(fields, 'hero_heading');
const subheading = getFieldByKey(fields, 'subheading');
const cta = getFieldByKey(fields, 'cta_button');
const bgImage = getFieldByKey(fields, 'background_image');

// Or use constants
const FIELD_KEYS = {
  HERO_HEADING: 'hero_heading',
  SUBHEADING: 'subheading',
  CTA_BUTTON: 'cta_button',
  BACKGROUND_IMAGE: 'background_image',
} as const;

const heading = getFieldByKey(fields, FIELD_KEYS.HERO_HEADING);
```

## Migration Path

### For New Fields
✅ Just add the field_key when creating new fields

### For Existing Fields
1. Run the database migration
2. Existing fields will have `field_key` = `name` initially
3. Edit fields to set proper snake_case field_keys
4. Update your code to use field_key instead of name

## Tips

1. **Use Descriptive Keys**: `hero_heading` is better than `h1` or `title`
2. **Be Consistent**: Always use snake_case
3. **Think Long-term**: Field keys should be stable, don't change them often
4. **Namespace When Needed**: `hero_title`, `footer_title`, `modal_title`
5. **Avoid Abbreviations**: `background_image` is better than `bg_img` (unless it's very common)

## Quick Reference

| Field Name | Good field_key | Bad field_key |
|------------|----------------|---------------|
| Hero Title | `hero_title` | `HeroTitle` |
| CTA Button | `cta_button` | `cta-button` |
| Background Image | `background_image` | `bgImg` |
| Section 1 Title | `section_1_title` | `Section 1 Title` |
| User Email | `user_email` | `userEmail` |

---

**Remember**: The field_key is for developers, the field name is for content editors!

