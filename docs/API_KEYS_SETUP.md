# API Keys Management Setup Guide

This guide will help you set up and use the API Keys management feature in your CMS.

## 🚀 Features

- ✅ Create and manage API keys with custom scopes
- ✅ Live and Test environment keys
- ✅ Per-website scoping
- ✅ Rate limiting
- ✅ Key expiration
- ✅ Key rotation
- ✅ Secure key generation and storage
- ✅ Comprehensive audit logging
- ✅ Beautiful, responsive UI

## 📋 Prerequisites

Before you begin, ensure you have:
- Supabase project set up
- PostgreSQL database with the required tables
- `pgcrypto` extension enabled (handled by migration)

## 🛠️ Installation Steps

### 1. Apply Database Migration

Run the migration to create the RPC function for API key generation:

```bash
# If using Supabase CLI
supabase db push

# Or apply the migration manually
psql -f supabase/migrations/20250124000001_create_api_key_generation_function.sql
```

### 2. Verify Table Structure

The `api_keys` table should already exist with the following structure:

```sql
CREATE TABLE public.api_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  website_id uuid,
  name text NOT NULL,
  key_prefix text NOT NULL,
  key_hash text NOT NULL,
  last_used_at timestamp with time zone,
  expires_at timestamp with time zone,
  scopes jsonb,
  rate_limit integer DEFAULT 1000,
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  revoked_at timestamp with time zone,
  revoked_by uuid,
  metadata jsonb,
  
  CONSTRAINT api_keys_pkey PRIMARY KEY (id),
  CONSTRAINT api_keys_tenant_id_fkey FOREIGN KEY (tenant_id) 
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  CONSTRAINT api_keys_website_id_fkey FOREIGN KEY (website_id) 
    REFERENCES public.cms_websites(id) ON DELETE CASCADE,
  CONSTRAINT api_keys_created_by_fkey FOREIGN KEY (created_by) 
    REFERENCES public.users(id),
  CONSTRAINT api_keys_key_hash_unique UNIQUE (key_hash)
);
```

### 3. Update Supabase Types (Optional but Recommended)

Generate updated TypeScript types to include the new RPC function:

```bash
# Using Supabase CLI
supabase gen types typescript --local > src/types/supabase.ts

# Or for remote database
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
```

### 4. Access the API Keys Page

Navigate to `/dashboard/api-keys` in your application to access the API keys management interface.

## 🎯 Usage

### Creating an API Key

1. Click the "Create API Key" button
2. Fill in the required information:
   - **Name**: Descriptive name for the key (e.g., "Production Website")
   - **Environment**: Choose Live or Test
   - **Website**: (Optional) Scope the key to a specific website
   - **Scopes**: Select Read and/or Write permissions
   - **Rate Limit**: Set requests per hour (default: 1000)
   - **Expires In**: Set expiration period or never
3. (Optional) Expand "Advanced Options" to add:
   - Description/Notes
   - Allowed Origins (CORS)
   - Allowed IP Addresses
4. Click "Create API Key"
5. **IMPORTANT**: Copy the generated key immediately - it won't be shown again!

### Managing API Keys

**View All Keys**
- See all API keys with their status, scopes, and usage
- Filter by status (Active/Revoked/Expired)
- Filter by website
- Search by name or key prefix

**Copy Key ID**
- Useful for referencing the key in logs or support

**Rotate Key**
- Creates a new key with the same settings
- Automatically revokes the old key
- Use this for regular key rotation as a security best practice

**Revoke Key**
- Immediately deactivates the key
- Cannot be undone
- Applications using this key will lose access immediately

**Delete Key**
- Permanently removes the key from the database
- Cannot be undone
- Use with caution

## 🔐 Security Best Practices

1. **Never Expose Keys in Client-Side Code**
   - Keep API keys server-side only
   - Never commit keys to version control

2. **Use Environment Variables**
   ```bash
   # .env.local
   CMS_API_KEY=cms_live_abc123...
   ```

3. **Rotate Keys Regularly**
   - Rotate keys every 90 days or when team members leave
   - Use the built-in rotation feature

4. **Use Test Keys for Development**
   - Keep separate test and live keys
   - Never use live keys in development

5. **Set Appropriate Rate Limits**
   - Start conservative (1000/hour)
   - Monitor usage and adjust as needed

6. **Scope Keys to Specific Websites**
   - Limit key access to only what's needed
   - Reduce blast radius if a key is compromised

7. **Monitor Key Usage**
   - Check "Last Used" dates regularly
   - Revoke unused keys

## 📚 API Usage Examples

### Using Your API Key

Include the API key in the `Authorization` header:

```bash
curl https://api.yourapp.com/v1/websites/{websiteId}/pages \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### JavaScript/TypeScript Example

```typescript
const response = await fetch('https://api.yourapp.com/v1/websites/123/pages', {
  headers: {
    'Authorization': `Bearer ${process.env.CMS_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
```

### Python Example

```python
import requests
import os

headers = {
    'Authorization': f'Bearer {os.getenv("CMS_API_KEY")}',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://api.yourapp.com/v1/websites/123/pages',
    headers=headers
)

data = response.json()
```

## 🔍 Key Formats

API keys follow this format:

- **Test Keys**: `cms_test_[64_hex_characters]`
- **Live Keys**: `cms_live_[64_hex_characters]`

Example: `cms_live_a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456`

## 🛡️ How Keys Are Stored

- **Plain Text**: Never stored - only shown once during creation
- **Hash**: Stored using bcrypt with salt rounds of 10
- **Prefix**: Stored to identify key type without revealing full key

## 📊 Rate Limiting

Rate limits are enforced per API key:

- Default: 1000 requests/hour
- Customizable per key
- Resets hourly
- 429 status code when exceeded

## 🐛 Troubleshooting

### Key Not Working

1. Check if the key is still active (not revoked or expired)
2. Verify the key has the required scopes (read/write)
3. Check rate limit hasn't been exceeded
4. Ensure correct Authorization header format

### Migration Failed

1. Ensure `pgcrypto` extension is available
2. Check database user has proper permissions
3. Verify all foreign key tables exist

### Types Not Updated

1. Regenerate Supabase types after migration
2. Restart TypeScript server
3. Clear Next.js cache: `rm -rf .next`

## 📞 Support

For issues or questions:
- Check the API documentation: `/docs/api`
- Review the code in `/src/components/api-keys/`
- Check server actions in `/src/actions/api-keys/`

## 🎨 Customization

### Changing Key Format

Edit the `generate_api_key` function in:
`supabase/functions/generate_api_key.sql`

### Adjusting UI

Components are located in:
`/src/components/api-keys/`

### Modifying Scopes

Update the scope options in:
`/src/types/api-keys.ts`

## 📝 License

This feature is part of your CMS and follows the same license.

