import { z } from "zod";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/supabaseServerClient";
import { getUploadUrl } from "@/server/utils/r2/operations";
import * as r2Paths from "@/server/utils/r2/paths";
import { getR2Bucket } from "@/server/utils/r2/client";

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
  "video/mp4",
] as const;

const uploadUrlRequestSchema = z.object({
  tenantId: z.string().uuid(),
  websiteId: z.string().uuid(),
  folderId: z.string().uuid().optional(),
  filename: z.string().trim().min(1).max(255),
  mimeType: z.enum(allowedMimeTypes),
  sizeBytes: z.number().int().positive().max(MAX_FILE_SIZE_BYTES),
});

function sanitizeFilename(filename: string): string {
  const trimmedFilename = filename.trim().toLowerCase();
  const extensionIndex = trimmedFilename.lastIndexOf(".");
  const hasExtension = extensionIndex > 0;
  const basename = hasExtension ? trimmedFilename.slice(0, extensionIndex) : trimmedFilename;
  const extension = hasExtension ? trimmedFilename.slice(extensionIndex) : "";

  const sanitizedBasename = basename
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");

  const sanitizedExtension = extension.replace(/[^a-z0-9.]/g, "");
  const safeBasename = sanitizedBasename || "file";

  return `${safeBasename}${sanitizedExtension}`;
}

function getFileType(mimeType: (typeof allowedMimeTypes)[number]): string {
  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  return "document";
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsedBody = uploadUrlRequestSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "Invalid upload request.",
        issues: parsedBody.error.flatten(),
      },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { tenantId, websiteId, folderId, filename, mimeType, sizeBytes } = parsedBody.data;

  try {
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id, storage_used_bytes, storage_quota_bytes")
      .eq("id", tenantId)
      .maybeSingle();

    if (tenantError) {
      console.error("Failed to load tenant for media upload.", tenantError);
      return NextResponse.json({ error: "Failed to validate tenant." }, { status: 500 });
    }

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found." }, { status: 403 });
    }

    const { data: membership, error: membershipError } = await supabase
      .from("user_tenants")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      console.error("Failed to validate tenant membership for media upload.", membershipError);
      return NextResponse.json({ error: "Failed to validate tenant membership." }, { status: 500 });
    }

    if (!membership) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { data: website, error: websiteError } = await supabase
      .from("cms_websites")
      .select("id")
      .eq("id", websiteId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (websiteError) {
      console.error("Failed to validate website for media upload.", websiteError);
      return NextResponse.json({ error: "Failed to validate website." }, { status: 500 });
    }

    if (!website) {
      return NextResponse.json(
        { error: "Website not found for the provided tenant." },
        { status: 400 }
      );
    }

    const currentStorageUsed = tenant.storage_used_bytes ?? 0;
    const storageQuota = tenant.storage_quota_bytes;

    if (storageQuota !== null && currentStorageUsed + sizeBytes > storageQuota) {
      return NextResponse.json({ error: "Storage quota exceeded." }, { status: 403 });
    }

    const uniqueFilename = `${crypto.randomUUID()}-${sanitizeFilename(filename)}`;
    const key = r2Paths.media(tenantId, websiteId, uniqueFilename);
    const uploadUrl = await getUploadUrl(key, mimeType, sizeBytes);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const { data: fileRecord, error: insertError } = await supabase
      .from("files")
      .insert({
        tenant_id: tenantId,
        website_id: websiteId,
        folder_id: folderId ?? null,
        filename: uniqueFilename,
        original_filename: filename,
        mime_type: mimeType,
        size_bytes: sizeBytes,
        storage_path: key,
        storage_bucket: getR2Bucket(),
        file_type: getFileType(mimeType),
        width: null,
        height: null,
        upload_status: "pending",
        uploaded_by: user.id,
        expires_at: expiresAt,
      })
      .select("id")
      .single();

    if (insertError || !fileRecord) {
      console.error("Failed to create pending media file record.", insertError);
      return NextResponse.json({ error: "Failed to create file record." }, { status: 500 });
    }

    return NextResponse.json({
      uploadUrl,
      fileId: fileRecord.id,
      key,
    });
  } catch (error) {
    console.error("Unexpected error generating media upload URL.", error);
    return NextResponse.json({ error: "Failed to generate upload URL." }, { status: 500 });
  }
}
