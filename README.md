# 🏗️ CMS Schema Builder

A visual, drag-and-drop schema builder for content management systems built with Next.js, Zustand, and Supabase.

## ✨ Features

### 🔹 Section Management
- **Visual Builder**: Create and manage content sections with an intuitive accordion interface
- **Real-time Updates**: Live preview of your schema as you build
- **Section Details**: Add names, descriptions, and organize your content types

### 🔸 Field Management
- **7 Field Types**: Text, Rich Text, Number, Boolean, Date, Image, Reference
- **Drag & Drop**: Reorder fields with smooth @dnd-kit integration
- **Field Validation**: Set required fields, default values, and validation rules
- **Field Properties**: Configure names, types, requirements, and defaults

### 🧾 Schema Preview
- **Live JSON Preview**: Real-time schema export in JSON format
- **Schema Statistics**: Overview of sections, fields, and field type distribution
- **Export/Import**: Download schemas as JSON files or import existing ones
- **Copy to Clipboard**: Quick schema sharing

### 🧠 State Management
- **Zustand Store**: Lightweight, performant state management
- **Local-first**: Work offline with local state
- **Persistence Ready**: Easy sync with Supabase backend

### 🗄️ Database Integration
- **PostgreSQL Schema**: Properly structured tables with relationships
- **Row Level Security**: Built-in RLS policies for multi-tenant support
- **Migration Ready**: SQL migration script included

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- Supabase project
- PostgreSQL database

### Installation

1. **Install Dependencies**
```bash
bun install
# or npm install
```

2. **Run Database Migration**
Execute the SQL migration in your Supabase dashboard:
```sql
-- Located in: supabase/migrations/001_create_cms_tables.sql
```

3. **Environment Variables**
Your `.env.local` should already have Supabase configured:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

4. **Start Development Server**
```bash
bun dev
# or npm run dev
```

5. **Access the CMS Builder**
Navigate to: `http://localhost:3000/dashboard/cms-builder`

## 📁 Project Structure

```
src/
├── types/cms.ts                    # TypeScript definitions
├── stores/useCMSStore.ts          # Zustand state management
├── lib/supabase/cms.ts            # Supabase API functions
├── components/cms/
│   ├── SectionBuilder.tsx         # Section management UI
│   ├── FieldBuilder.tsx           # Field management with DnD
│   └── SchemaPreview.tsx          # JSON preview & export
└── app/dashboard/cms-builder/
    └── page.tsx                   # Main CMS builder page
```

## 🎯 Usage Guide

### Creating Your First Schema

1. **Add a Section**
   - Click "Add Section" button
   - Enter section name (e.g., "Blog Post", "Product")
   - Add optional description
   - Save the section

2. **Add Fields to Section**
   - Open the section accordion
   - Click "Add Field" within the section
   - Choose field type and configure properties
   - Set as required if needed
   - Add validation rules (optional)

3. **Organize Fields**
   - Drag and drop to reorder fields
   - Edit field properties anytime
   - Remove fields you don't need

4. **Preview & Export**
   - Switch to "Preview" tab
   - See live JSON schema
   - Export as JSON file
   - Copy to clipboard for sharing

### Field Types Reference

| Type | Description | Use Cases |
|------|-------------|-----------|
| **Text** | Single-line text input | Titles, names, short descriptions |
| **Rich Text** | Multi-line WYSIWYG editor | Blog content, detailed descriptions |
| **Number** | Numeric input with validation | Prices, quantities, ratings |
| **Boolean** | True/false checkbox | Published status, featured items |
| **Date** | Date picker with calendar | Publication dates, events |
| **Image** | File upload for images | Featured images, gallery photos |
| **Reference** | Link to other sections | Categories, authors, related posts |

### Database Schema

The CMS creates two main tables:

#### `cms_sections`
- `id` - UUID primary key
- `name` - Section name
- `description` - Optional description
- `created_at`, `updated_at` - Timestamps

#### `cms_fields`
- `id` - UUID primary key
- `section_id` - Foreign key to sections
- `name` - Field name
- `type` - Field type enum
- `required` - Boolean flag
- `default_value` - Optional default
- `validation` - Validation rules
- `order` - Field ordering
- `created_at`, `updated_at` - Timestamps

## 🔧 API Reference

### Zustand Store Actions

```typescript
// Section Management
addSection(name: string, description?: string)
updateSection(id: string, data: Partial<Section>)
removeSection(id: string)

// Field Management
addField(sectionId: string, field: Omit<Field, 'id'>)
updateField(sectionId: string, fieldId: string, data: Partial<Field>)
removeField(sectionId: string, fieldId: string)
reorderFields(sectionId: string, newFields: Field[])

// Schema Management
loadSchema(sections: Section[])
exportSchema(): Section[]
```

### Supabase API Functions

```typescript
// Located in src/lib/supabase/cms.ts
cmsAPI.getSections()           // Load all sections with fields
cmsAPI.createSection()         // Create new section
cmsAPI.updateSection()         // Update section details
cmsAPI.deleteSection()         // Delete section and fields
cmsAPI.createField()           // Add field to section
cmsAPI.updateField()           // Update field properties
cmsAPI.deleteField()           // Remove field
cmsAPI.reorderFields()         // Update field order
cmsAPI.saveSchema()            // Save entire schema
```

## 🎨 Customization

### Adding New Field Types

1. **Update Types**
```typescript
// src/types/cms.ts
export type FieldType = "text" | "number" | "boolean" | "date" | "richtext" | "image" | "reference" | "your_new_type";
```

2. **Update Field Builder**
```typescript
// src/components/cms/FieldBuilder.tsx
const fieldTypes = [
  // ... existing types
  { value: 'your_new_type', label: 'Your New Type', description: 'Description of your type' }
];
```

3. **Update Database Enum**
```sql
ALTER TYPE field_type ADD VALUE 'your_new_type';
```

### Styling Customization

The components use Tailwind CSS and shadcn/ui. Customize by:
- Modifying Tailwind classes in components
- Updating shadcn/ui theme in `tailwind.config.ts`
- Adding custom CSS in component files

## 🛡️ Security

- **Row Level Security**: Enabled on all CMS tables
- **Authentication Required**: All operations require authenticated users
- **Input Validation**: Client-side and server-side validation
- **SQL Injection Protection**: Using Supabase prepared statements

## 🧪 Testing

The CMS is ready for testing with:
1. Create a few sample sections
2. Add various field types
3. Test drag-and-drop reordering
4. Export and import schemas
5. Verify database persistence

## 🔮 Future Enhancements

### Planned Features
- [ ] **Authentication Integration**: Per-user schemas
- [ ] **Public Schema Sharing**: Read-only schema links
- [ ] **Live Form Renderer**: Preview content forms
- [ ] **API Generator**: Auto-generate REST/GraphQL APIs
- [ ] **Nested Fields**: Support for repeatable/nested content
- [ ] **Field Validation UI**: Visual validation rule builder
- [ ] **Schema Versioning**: Track schema changes over time
- [ ] **Bulk Operations**: Import/export multiple schemas

### Stretch Goals
- [ ] **Visual Form Builder**: Drag-and-drop form designer
- [ ] **Custom Field Types**: Plugin system for field extensions
- [ ] **Schema Templates**: Pre-built content models
- [ ] **Collaboration Features**: Multi-user schema editing
- [ ] **Schema Analytics**: Usage statistics and insights

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is part of a larger application. Check the main project license.

## 🆘 Support

- **Documentation**: This README and code comments
- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub discussions for questions

---

**Built with ❤️ using Next.js, Zustand, Supabase, and shadcn/ui** 