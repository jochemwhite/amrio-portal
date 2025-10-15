import { createClient } from '@/lib/supabase/supabaseServerClient'
import { nanoid } from 'nanoid'
import { NextRequest } from 'next/server'
import sharp from 'sharp'

// Configure route to handle large file uploads
export const maxDuration = 60 // 60 seconds max execution time
export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB per file
const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv',
  // Videos
  'video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm',
  // Audio
  'audio/mpeg', 'audio/wav', 'audio/ogg',
]

function getFileType(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if ([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ].includes(mimeType)) return 'document'
  return 'other'
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const formData = await request.formData()
    
    const file = formData.get('file') as File
    const tenantId = formData.get('tenantId') as string
    const websiteId = formData.get('websiteId') as string | null
    const folder = formData.get('folder') as string | null
    const description = formData.get('description') as string | null
    const altText = formData.get('altText') as string | null
    const tags = formData.get('tags') as string | null
    
    if (!file || !tenantId) {
      return Response.json({ 
        error: 'Missing required fields: file and tenantId' 
      }, { status: 400 })
    }
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Verify tenant access
    const { data: tenantAccess, error: accessError } = await supabase
      .from('user_tenants')
      .select('id')
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)
      .single()
    
    if (accessError || !tenantAccess) {
      return Response.json({ error: 'Access denied to this tenant' }, { status: 403 })
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return Response.json({ 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` 
      }, { status: 413 })
    }
    
    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return Response.json({ 
        error: `File type ${file.type} is not allowed` 
      }, { status: 415 })
    }
    
    // Check storage quota
    const { data: tenant } = await supabase
      .from('tenants')
      .select('storage_used_bytes, storage_quota_bytes')
      .eq('id', tenantId)
      .single()
    
    if (!tenant) {
      return Response.json({ error: 'Tenant not found' }, { status: 404 })
    }
    const newTotal = (tenant.storage_used_bytes || 0) + file.size
    if (newTotal > (tenant.storage_quota_bytes || 0)) {
      const remainingBytes = Math.max(0, (tenant.storage_quota_bytes || 0) - (tenant.storage_used_bytes || 0))
      const remainingMB = (remainingBytes / 1024 / 1024).toFixed(2)
      const requiredMB = (file.size / 1024 / 1024).toFixed(2)
      
      return Response.json({ 
        error: 'Storage quota exceeded',
        details: {
          used_bytes: tenant.storage_used_bytes,
          quota_bytes: tenant.storage_quota_bytes,
          remaining_mb: remainingMB,
          required_mb: requiredMB
        }
      }, { status: 507 })
    }
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin'
    const uniqueFilename = `${nanoid()}.${fileExt}`
    
    // Build storage path: {tenant_id}/{website_id or 'global'}/{folder or 'uploads'}/{filename}
    const pathParts = [
      tenantId,
      websiteId || 'global',
      folder || 'uploads',
      uniqueFilename
    ]
    const storagePath = pathParts.join('/')
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('cms_storage')
      .upload(storagePath, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })
    
    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return Response.json({ 
        error: 'Failed to upload file to storage',
        details: uploadError.message 
      }, { status: 500 })
    }
    
    // Get image dimensions if it's an image
    let width: number | null = null
    let height: number | null = null
    
    if (file.type.startsWith('image/') && file.type !== 'image/svg+xml') {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const metadata = await sharp(buffer).metadata()
        width = metadata.width || null
        height = metadata.height || null
      } catch (error) {
        console.error('Failed to get image dimensions:', error)
      }
    }
    
    // Parse tags
    const tagsArray = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []
    
    // Save metadata to database
    const { data: fileRecord, error: dbError } = await supabase
      .from('files')
      .insert({
        tenant_id: tenantId,
        website_id: websiteId,
        filename: uniqueFilename,
        original_filename: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        storage_path: storagePath,
        storage_bucket: 'cms_storage',
        file_type: getFileType(file.type),
        width,
        height,
        folder: folder || null,
        tags: tagsArray.length > 0 ? tagsArray : null,
        description: description || null,
        alt_text: altText || null,
        uploaded_by: user.id
      })
      .select()
      .single()
    
    if (dbError) {
      console.error('Database insert error:', dbError)
      // Rollback: delete from storage
      await supabase.storage.from('cms_storage').remove([storagePath])
      return Response.json({ 
        error: 'Failed to save file metadata',
        details: dbError.message 
      }, { status: 500 })
    }
    
    // Get updated storage info
    const { data: updatedTenant } = await supabase
      .from('tenants')
      .select('storage_used_bytes, storage_quota_bytes')
      .eq('id', tenantId)
      .single()
    
    // Generate public URL (if bucket is public) or signed URL
    const { data: urlData } = await supabase.storage
      .from('cms_storage')
      .createSignedUrl(storagePath, 3600) // 1 hour
    
    return Response.json({ 
      success: true,
      file: fileRecord,
      url: urlData?.signedUrl,
      storage: {
        used_bytes: updatedTenant?.storage_used_bytes || 0,
        quota_bytes: updatedTenant?.storage_quota_bytes || 0,
        used_mb: ((updatedTenant?.storage_used_bytes || 0) / 1024 / 1024).toFixed(2),
        quota_mb: ((updatedTenant?.storage_quota_bytes || 0) / 1024 / 1024).toFixed(2),
        percentage: ((updatedTenant?.storage_used_bytes || 0) / (updatedTenant?.storage_quota_bytes || 1) * 100).toFixed(2)
      }
    }, { status: 201 })
    
  } catch (error) {
    console.error('Upload error:', error)
    return Response.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

