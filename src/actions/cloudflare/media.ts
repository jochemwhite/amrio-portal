"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/supabaseServerClient";
import { purgeFromCache } from "@/server/utils/r2/cache";
import { deleteObject, objectExists } from "@/server/utils/r2/operations";
import { Database } from "@/types/supabase";

type MediaFile = Database["public"]["Tables"]["files"]["Row"];
type MediaFolder = Database["public"]["Tables"]["folders"]["Row"];
type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function slugifyName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function requireAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized: User not authenticated.");
  }

  return { supabase, user };
}

async function assertTenantMembership(
  supabase: SupabaseServerClient,
  tenantId: string,
  userId: string,
): Promise<void> {
  const { data: membership, error } = await supabase
    .from("user_tenants")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to verify tenant membership: ${error.message}`);
  }

  if (!membership) {
    throw new Error("Forbidden: You do not belong to this tenant.");
  }
}

async function assertWebsiteAccess(
  supabase: SupabaseServerClient,
  tenantId: string,
  websiteId: string,
): Promise<void> {
  const { data: website, error } = await supabase
    .from("cms_websites")
    .select("id")
    .eq("id", websiteId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to verify website access: ${error.message}`);
  }

  if (!website) {
    throw new Error("Website not found for this tenant.");
  }
}

async function getAccessibleFileRecord(fileId: string, userId: string) {
  const { supabase } = await requireAuthenticatedUser();
  const { data: fileRecord, error } = await supabase
    .from("files")
    .select("*")
    .eq("id", fileId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load file record: ${error.message}`);
  }

  if (!fileRecord) {
    throw new Error("File not found.");
  }

  await assertTenantMembership(supabase, fileRecord.tenant_id, userId);

  return { supabase, fileRecord: fileRecord as MediaFile };
}

async function getAccessibleFolderRecord(folderId: string, userId: string) {
  const { supabase } = await requireAuthenticatedUser();
  const { data: folderRecord, error } = await supabase
    .from("folders")
    .select("*")
    .eq("id", folderId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load folder record: ${error.message}`);
  }

  if (!folderRecord) {
    throw new Error("Folder not found.");
  }

  await assertTenantMembership(supabase, folderRecord.tenant_id, userId);

  return { supabase, folderRecord: folderRecord as MediaFolder };
}

function revalidateMediaPaths() {
  revalidatePath("/dashboard/storage");
}

export async function confirmUpload(
  fileId: string,
  originalFilename: string,
  width?: number,
  height?: number,
): Promise<MediaFile> {
  const {
    supabase,
    user: { id: userId },
  } = await requireAuthenticatedUser();
  const { fileRecord } = await getAccessibleFileRecord(fileId, userId);

  if (fileRecord.upload_status !== "pending") {
    throw new Error("Only pending uploads can be confirmed.");
  }

  if (!fileRecord.expires_at) {
    throw new Error("This upload is missing an expiration timestamp.");
  }

  if (new Date(fileRecord.expires_at).getTime() <= Date.now()) {
    throw new Error("This upload has expired and must be started again.");
  }

  const existsInStorage = await objectExists(fileRecord.storage_path);

  if (!existsInStorage) {
    throw new Error("The uploaded file was not found in Cloudflare R2.");
  }

  const { data: updatedFile, error: updateError } = await supabase
    .from("files")
    .update({
      upload_status: "confirmed",
      original_filename: originalFilename,
      width: width ?? null,
      height: height ?? null,
      expires_at: null,
    })
    .eq("id", fileId)
    .eq("upload_status", "pending")
    .select("*")
    .single();

  if (updateError || !updatedFile) {
    throw new Error(
      `Failed to confirm file upload: ${updateError?.message ?? "Unknown error."}`,
    );
  }

  const { error: storageUsageError } = await supabase.rpc(
    "increment_storage_used",
    {
      p_tenant_id: fileRecord.tenant_id,
      p_bytes: fileRecord.size_bytes,
    },
  );

  if (storageUsageError) {
    throw new Error(
      `Failed to increment tenant storage usage: ${storageUsageError.message}`,
    );
  }

  revalidateMediaPaths();

  return updatedFile as MediaFile;
}

export async function deleteFile(
  fileId: string,
): Promise<{ success: boolean }> {
  const supabase = await createClient();

  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return {
      success: false,
    };
  }

  const { fileRecord } = await getAccessibleFileRecord(fileId, data.user.id);

  await deleteObject(fileRecord.storage_path);

  if (fileRecord.upload_status === "confirmed") {
    await purgeFromCache(fileRecord.storage_path);
  }

  const { error: updateError } = await supabase
    .from("files")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("id", fileId)
    .is("deleted_at", null);

  if (updateError) {
    console.log(updateError);
    throw new Error(
      `Failed to soft delete file record: ${updateError.message}`,
    );
  }

  if (fileRecord.upload_status === "confirmed") {
    const { error: storageUsageError } = await supabase.rpc(
      "decrement_storage_used",
      {
        p_tenant_id: fileRecord.tenant_id,
        p_bytes: fileRecord.size_bytes,
      },
    );

    if (storageUsageError) {
      throw new Error(
        `Failed to decrement tenant storage usage: ${storageUsageError.message}`,
      );
    }
  }

  revalidateMediaPaths();

  return { success: true };
}

export async function createFolder(
  name: string,
  parentFolderId: string | undefined,
  tenantId: string,
  websiteId: string,
): Promise<MediaFolder> {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("Folder name cannot be empty.");
  }

  if (trimmedName.length > 50) {
    throw new Error("Folder name must be 50 characters or fewer.");
  }

  const slug = slugifyName(trimmedName);

  if (!slug) {
    throw new Error("Folder name must include letters or numbers.");
  }

  const {
    supabase,
    user: { id: userId },
  } = await requireAuthenticatedUser();

  await assertTenantMembership(supabase, tenantId, userId);
  await assertWebsiteAccess(supabase, tenantId, websiteId);

  let fullPath = slug;

  if (parentFolderId) {
    const { folderRecord: parentFolder } = await getAccessibleFolderRecord(
      parentFolderId,
      userId,
    );

    if (
      parentFolder.tenant_id !== tenantId ||
      parentFolder.website_id !== websiteId
    ) {
      throw new Error("Parent folder does not belong to the selected website.");
    }

    fullPath = `${parentFolder.full_path}/${slug}`;
  }

  const { data: folder, error } = await supabase
    .from("folders")
    .insert({
      name: trimmedName,
      slug,
      full_path: fullPath,
      parent_folder_id: parentFolderId ?? null,
      tenant_id: tenantId,
      website_id: websiteId,
      created_by: userId,
    })
    .select("*")
    .single();

  if (error || !folder) {
    throw new Error(
      `Failed to create folder: ${error?.message ?? "Unknown error."}`,
    );
  }

  revalidatePath("/dashboard/storage");

  return folder as MediaFolder;
}

export async function renameFolder(
  folderId: string,
  newName: string,
): Promise<MediaFolder> {
  const trimmedName = newName.trim();

  if (!trimmedName) {
    throw new Error("Folder name cannot be empty.");
  }

  if (trimmedName.length > 50) {
    throw new Error("Folder name must be 50 characters or fewer.");
  }

  const slug = slugifyName(trimmedName);

  if (!slug) {
    throw new Error("Folder name must include letters or numbers.");
  }

  const {
    user: { id: userId },
  } = await requireAuthenticatedUser();
  const { supabase, folderRecord } = await getAccessibleFolderRecord(
    folderId,
    userId,
  );
  const oldFullPath = folderRecord.full_path;
  const parentPrefix = folderRecord.parent_folder_id
    ? oldFullPath.slice(0, oldFullPath.lastIndexOf("/"))
    : "";
  const newFullPath = parentPrefix ? `${parentPrefix}/${slug}` : slug;

  const { data: folder, error } = await supabase
    .from("folders")
    .update({
      name: trimmedName,
      slug,
      full_path: newFullPath,
    })
    .eq("id", folderId)
    .select("*")
    .single();

  if (error || !folder) {
    throw new Error(
      `Failed to rename folder: ${error?.message ?? "Unknown error."}`,
    );
  }

  if (newFullPath !== oldFullPath) {
    const { data: descendants, error: descendantsError } = await supabase
      .from("folders")
      .select("id, full_path")
      .like("full_path", `${oldFullPath}/%`)
      .is("deleted_at", null);

    if (descendantsError) {
      throw new Error(
        `Failed to update child folders: ${descendantsError.message}`,
      );
    }

    for (const descendant of descendants ?? []) {
      const descendantFullPath = descendant.full_path.replace(
        oldFullPath,
        newFullPath,
      );
      const { error: descendantUpdateError } = await supabase
        .from("folders")
        .update({ full_path: descendantFullPath })
        .eq("id", descendant.id);

      if (descendantUpdateError) {
        throw new Error(
          `Failed to update child folder path: ${descendantUpdateError.message}`,
        );
      }
    }
  }

  revalidatePath("/dashboard/storage");

  return folder as MediaFolder;
}

export async function deleteFolder(
  folderId: string,
): Promise<{ success: true }> {
  const {
    user: { id: userId },
  } = await requireAuthenticatedUser();
  const { supabase, folderRecord } = await getAccessibleFolderRecord(
    folderId,
    userId,
  );

  const { count: fileCount, error: fileCountError } = await supabase
    .from("files")
    .select("id", { count: "exact", head: true })
    .eq("folder_id", folderId)
    .is("deleted_at", null);

  if (fileCountError) {
    throw new Error(
      `Failed to check folder contents: ${fileCountError.message}`,
    );
  }

  if ((fileCount ?? 0) > 0) {
    throw new Error("Folder cannot be deleted while it still contains files.");
  }

  const { count: childFolderCount, error: childFolderCountError } =
    await supabase
      .from("folders")
      .select("id", { count: "exact", head: true })
      .eq("parent_folder_id", folderId)
      .is("deleted_at", null);

  if (childFolderCountError) {
    throw new Error(
      `Failed to check child folders: ${childFolderCountError.message}`,
    );
  }

  if ((childFolderCount ?? 0) > 0) {
    throw new Error(
      "Folder cannot be deleted while it still contains subfolders.",
    );
  }

  const { error: updateError } = await supabase
    .from("folders")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", folderRecord.id)
    .is("deleted_at", null);

  if (updateError) {
    throw new Error(`Failed to delete folder: ${updateError.message}`);
  }

  revalidatePath("/dashboard/storage");

  return { success: true };
}

export async function moveFile(
  fileId: string,
  targetFolderId: string | null,
): Promise<MediaFile> {
  const {
    user: { id: userId },
  } = await requireAuthenticatedUser();
  const { supabase, fileRecord } = await getAccessibleFileRecord(
    fileId,
    userId,
  );

  if (targetFolderId) {
    const { folderRecord } = await getAccessibleFolderRecord(
      targetFolderId,
      userId,
    );

    if (
      folderRecord.tenant_id !== fileRecord.tenant_id ||
      folderRecord.website_id !== fileRecord.website_id
    ) {
      throw new Error("Target folder does not belong to the same website.");
    }
  }

  const { data: updatedFile, error } = await supabase
    .from("files")
    .update({ folder_id: targetFolderId })
    .eq("id", fileId)
    .is("deleted_at", null)
    .select("*")
    .single();

  if (error || !updatedFile) {
    throw new Error(
      `Failed to move file: ${error?.message ?? "Unknown error."}`,
    );
  }

  revalidatePath("/dashboard/storage");

  return updatedFile as MediaFile;
}
