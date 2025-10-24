# API Keys Management - Quick Start 🚀

## ✨ What You Got

A complete, production-ready API Keys management system with:

- **8 React Components** - Beautiful UI with all features
- **Server Actions** - Type-safe backend operations
- **Database Function** - Secure key generation
- **Complete Documentation** - Setup guides and examples

## 🏃 Get Started in 3 Steps

### Step 1: Apply Database Migration

```bash
cd /home/jochemwhite/documents/github/cms

# If using Supabase CLI
supabase db push

# Or manually
psql -f supabase/migrations/20250124000001_create_api_key_generation_function.sql
```

### Step 2: Regenerate Types (Optional but Recommended)

```bash
# For local database
supabase gen types typescript --local > src/types/supabase.ts

# For remote database
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
```

### Step 3: Access the Page

Visit: **http://localhost:3000/dashboard/api-keys**

That's it! 🎉

## 📁 What Was Created

### Backend Files

```
src/
├── actions/
│   └── api-keys/
│       └── api-key-actions.ts          # Server actions (350+ lines)
├── types/
│   └── api-keys.ts                     # TypeScript types
└── app/
    └── dashboard/
        └── api-keys/
            └── page.tsx                 # Main page

supabase/
├── functions/
│   └── generate_api_key.sql            # RPC function
└── migrations/
    └── 20250124000001_*.sql            # Database migration
```

### Frontend Components (8 files)

```
src/components/api-keys/
├── ApiKeysManagement.tsx       # Main container (150+ lines)
├── ApiKeysTable.tsx            # Table with actions (220+ lines)
├── CreateApiKeyDialog.tsx      # Creation form (320+ lines)
├── ApiKeySuccessModal.tsx      # One-time key display (140+ lines)
├── RevokeApiKeyDialog.tsx      # Revoke confirmation (80+ lines)
├── DeleteApiKeyDialog.tsx      # Delete confirmation (80+ lines)
├── RotateApiKeyDialog.tsx      # Key rotation (100+ lines)
└── ApiDocumentation.tsx        # API docs & examples (230+ lines)
```

### Documentation (3 files)

```
docs/
├── API_KEYS_SETUP.md              # Complete setup guide
├── API_KEYS_IMPLEMENTATION.md     # Technical details
└── API_KEYS_QUICK_START.md        # This file
```

## 🎯 Key Features

### For Users
- ✅ Create API keys with custom settings
- ✅ Live and Test environments
- ✅ Website-specific scoping
- ✅ Read/Write permissions
- ✅ Rate limiting (requests/hour)
- ✅ Key expiration
- ✅ One-time key display (security!)
- ✅ Key rotation
- ✅ Quick actions (copy, revoke, delete)
- ✅ Search and filtering
- ✅ API usage examples

### For Developers
- ✅ Full TypeScript support
- ✅ Server-side rendering
- ✅ Secure bcrypt hashing
- ✅ Clean component architecture
- ✅ Toast notifications
- ✅ Loading states
- ✅ Error handling
- ✅ Responsive design

## 🔐 Security Features

- **Bcrypt hashing** with salt rounds 10
- **One-time display** of full key
- **Masked keys** in UI (e.g., `cms_live_••••••••`)
- **Key prefixes** for easy identification
- **Expiration dates** support
- **Metadata** for origins/IPs restrictions
- **Audit trail** (created_by, revoked_by)

## 📸 What It Looks Like

**Main Page:**
- Header with title and description
- Search bar and filters (Status, Website)
- "Create API Key" button
- Table with all keys and their details
- API documentation section

**Create Dialog:**
- Name field
- Environment selector (Live/Test)
- Website dropdown (optional)
- Scope checkboxes (Read/Write)
- Rate limit input
- Expiration selector
- Collapsible advanced options

**Success Modal:**
- ⚠️ Warning about one-time display
- Full API key with copy button
- Example usage snippet
- Confirmation checkbox

## 🧪 Quick Test

1. Navigate to `/dashboard/api-keys`
2. Click "Create API Key"
3. Enter:
   - Name: "Test Key"
   - Environment: Test
   - Scopes: Read (checked)
4. Click "Create API Key"
5. Copy the generated key
6. Check the confirmation box
7. Close the modal
8. See your key in the table!

## 📚 More Information

- **Full Setup Guide**: `docs/API_KEYS_SETUP.md`
- **Implementation Details**: `docs/API_KEYS_IMPLEMENTATION.md`
- **Code Location**: `src/components/api-keys/`
- **Server Actions**: `src/actions/api-keys/`

## 🐛 Troubleshooting

**Migration Error?**
```bash
# Check if pgcrypto is enabled
psql -c "SELECT * FROM pg_extension WHERE extname = 'pgcrypto';"

# If not, enable it
psql -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
```

**Type Errors?**
- The code uses `as any` for the RPC call until you regenerate types
- This is intentional and safe
- Regenerate types after migration to remove it

**Can't See the Page?**
- Check you're logged in
- Verify you have an active tenant selected
- Check browser console for errors

## 🎨 Customization

### Add to Navigation

```tsx
// src/components/layout/DashboardNav.tsx
import { Key } from "lucide-react";

const navItems = [
  // ... other items
  {
    title: "API Keys",
    href: "/dashboard/api-keys",
    icon: Key,
  },
];
```

### Change Colors

All components use Tailwind CSS classes:
- Find badge colors in `ApiKeysTable.tsx`
- Update className props to change styling

### Modify Rate Limits

Default is 1000 requests/hour. Change in:
- `CreateApiKeyDialog.tsx` - Line where `rateLimit` state is initialized
- `api-key-actions.ts` - Fallback values

## 💡 Usage Example

Once you have an API key, use it like this:

```bash
curl https://api.yourapp.com/v1/websites/123/pages \
  -H "Authorization: Bearer cms_live_your_key_here"
```

```javascript
const response = await fetch('https://api.yourapp.com/v1/pages', {
  headers: {
    'Authorization': `Bearer ${process.env.CMS_API_KEY}`
  }
});
```

## ✅ Production Ready

This implementation includes:
- ✅ Security best practices
- ✅ Error handling
- ✅ Loading states
- ✅ User feedback (toasts)
- ✅ Responsive design
- ✅ Type safety
- ✅ Documentation
- ✅ Testing guidelines

## 🎉 You're Done!

The API Keys management system is fully implemented and ready to use. Just apply the migration and start creating keys!

**Questions?** Check the detailed guides:
- `docs/API_KEYS_SETUP.md` - Comprehensive setup
- `docs/API_KEYS_IMPLEMENTATION.md` - Technical details

**Happy coding!** 🚀

