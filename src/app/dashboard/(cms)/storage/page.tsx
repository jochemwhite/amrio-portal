"use client";

import { useState, useEffect, useCallback } from "react";
import { FileManager, type StorageFile, type UploadProgress } from "@/components/storage";
import type { StorageInfo } from "@/components/storage/types";
import { createClient } from "@/lib/supabase/supabaseClient";
import { useActiveTenant } from "@/hooks/use-active-tenant";
import { toast } from "sonner";

const BUCKET_NAME = "cms_storage";

export default function StoragePage() {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [allFiles, setAllFiles] = useState<StorageFile[]>([]); // For search filtering
  const [isLoading, setIsLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const { activeTenant } = useActiveTenant();
  const supabase = createClient();

  // Fetch storage info
  const fetchStorageInfo = useCallback(async () => {
    if (!activeTenant?.id) return;

    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('storage_used_bytes, storage_quota_bytes')
        .eq('id', activeTenant.id)
        .single();

      if (error) throw error;

      if (data) {
        const usedBytes = data.storage_used_bytes || 0;
        const quotaBytes = data.storage_quota_bytes || 0;
        const usedMB = (usedBytes / 1024 / 1024).toFixed(2);
        const quotaMB = (quotaBytes / 1024 / 1024).toFixed(2);
        const percentage = quotaBytes > 0 ? ((usedBytes / quotaBytes) * 100).toFixed(2) : '0';

        setStorageInfo({
          used_bytes: usedBytes,
          quota_bytes: quotaBytes,
          used_mb: usedMB,
          quota_mb: quotaMB,
          percentage: percentage,
        });
      }
    } catch (error) {
      console.error("Error fetching storage info:", error);
    }
  }, [activeTenant?.id, supabase]);

  // Fetch files from database
  const fetchFiles = useCallback(async () => {
    if (!activeTenant?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('tenant_id', activeTenant.id)
        .is('deleted_at', null) // Filter out soft-deleted files
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Map database records to StorageFile format
        const storageFiles: StorageFile[] = await Promise.all(
          data.map(async (file) => {
            // Get signed URL for the file
            const { data: urlData } = await supabase.storage
              .from(BUCKET_NAME)
              .createSignedUrl(file.storage_path, 3600); // 1 hour

            return {
              id: file.id,
              name: file.original_filename,
              url: urlData?.signedUrl || '',
              size: file.size_bytes,
              mimeType: file.mime_type,
              createdAt: file.created_at || new Date().toISOString(),
              updatedAt: file.updated_at || undefined,
              altText: file.alt_text || undefined,
              metadata: {
                width: file.width,
                height: file.height,
                folder: file.folder,
                tags: file.tags,
                description: file.description,
                fileType: file.file_type,
                downloadCount: file.download_count,
              }
            };
          })
        );

        setFiles(storageFiles);
        setAllFiles(storageFiles);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      toast.error("Failed to load files. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [activeTenant?.id, supabase]);

  // Fetch files and storage info on mount and when tenant changes
  useEffect(() => {
    fetchFiles();
    fetchStorageInfo();
  }, [fetchFiles, fetchStorageInfo]);

  // Upload files
  const handleUpload = async (filesToUpload: File[]) => {
    if (!activeTenant?.id) {
      toast.error("No active tenant selected.");
      return;
    }

    for (const file of filesToUpload) {
      // Add to progress tracking
      setUploadProgress((prev) => [
        ...prev,
        { fileName: file.name, progress: 0, status: "uploading" },
      ]);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tenantId', activeTenant.id);
        
        const response = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Upload failed');
        }

        // Update progress to complete
        setUploadProgress((prev) =>
          prev.map((p) =>
            p.fileName === file.name
              ? { ...p, status: "complete", progress: 100 }
              : p
          )
        );

        toast.success(`${file.name} uploaded successfully.`);

        // Refresh file list and storage info
        await fetchFiles();
        await fetchStorageInfo();
      } catch (error: any) {
        console.error("Upload error:", error);
        setUploadProgress((prev) =>
          prev.map((p) =>
            p.fileName === file.name
              ? { ...p, status: "error", error: error.message }
              : p
          )
        );

        toast.error(error.message || `Failed to upload ${file.name}`);
      }
    }

    // Clear upload progress after 3 seconds
    setTimeout(() => {
      setUploadProgress([]);
    }, 3000);
  };

  // Delete file
  const handleDelete = async (fileId: string) => {
    if (!activeTenant?.id) return;

    const file = files.find((f) => f.id === fileId);
    if (!file) return;

    try {
      // Get file record from database to get storage path and size
      const { data: fileRecord, error: fetchError } = await supabase
        .from('files')
        .select('storage_path, size_bytes, storage_bucket')
        .eq('id', fileId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage bucket
      const { error: storageError } = await supabase.storage
        .from(fileRecord.storage_bucket)
        .remove([fileRecord.storage_path]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        // Continue with database deletion even if storage fails
      }

      // Delete from database (hard delete)
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      setAllFiles((prev) => prev.filter((f) => f.id !== fileId));

      // Refresh storage info after deletion
      await fetchStorageInfo();

      toast.success(`${file.name} deleted successfully.`);
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete file.");
    }
  };

  // Update file metadata (rename, alt text, etc.)
  const handleRename = async (
    fileId: string,
    newName: string,
    altText?: string
  ) => {
    if (!activeTenant?.id) return;

    const file = files.find((f) => f.id === fileId);
    if (!file) return;

    try {
      // Update database record with new metadata
      const { error: dbError } = await supabase
        .from('files')
        .update({
          original_filename: newName,
          alt_text: altText || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', fileId);

      if (dbError) throw dbError;

      // Update local state
      const updateFile = (f: StorageFile) => {
        if (f.id === fileId) {
          return {
            ...f,
            name: newName,
            altText: altText || undefined,
            updatedAt: new Date().toISOString(),
          };
        }
        return f;
      };

      setFiles((prev) => prev.map(updateFile));
      setAllFiles((prev) => prev.map(updateFile));

      toast.success(`File updated successfully`);
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error(error.message || "Failed to update file.");
    }
  };

  // Download file
  const handleDownload = async (file: StorageFile) => {
    if (!activeTenant?.id) return;

    try {
      // Get file record from database to get storage path and download count
      const { data: fileRecord, error: fetchError } = await supabase
        .from('files')
        .select('storage_path, storage_bucket, download_count')
        .eq('id', file.id)
        .single();

      if (fetchError) throw fetchError;

      const { data, error } = await supabase.storage
        .from(fileRecord.storage_bucket)
        .download(fileRecord.storage_path);

      if (error) throw error;

      // Update download count and last accessed time
      await supabase
        .from('files')
        .update({
          download_count: (fileRecord.download_count || 0) + 1,
          last_accessed_at: new Date().toISOString(),
        })
        .eq('id', file.id);

      // Create download link
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`${file.name} downloaded successfully.`);
    } catch (error: any) {
      console.error("Download error:", error);
      toast.error(error.message || "Failed to download file.");
    }
  };

  // Search/filter files
  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFiles(allFiles);
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    const filtered = allFiles.filter((file) => {
      const name = file.name.toLowerCase();
      const altText = file.altText?.toLowerCase() || '';
      const mimeType = file.mimeType.toLowerCase();
      const description = file.metadata?.description?.toLowerCase() || '';
      const folder = file.metadata?.folder?.toLowerCase() || '';
      const tags = file.metadata?.tags?.join(' ').toLowerCase() || '';
      
      return (
        name.includes(lowercaseQuery) ||
        altText.includes(lowercaseQuery) ||
        mimeType.includes(lowercaseQuery) ||
        description.includes(lowercaseQuery) ||
        folder.includes(lowercaseQuery) ||
        tags.includes(lowercaseQuery)
      );
    });
    setFiles(filtered);
  };

  // Show loading state while tenant is initializing
  if (!activeTenant && isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Loading tenant...</p>
        </div>
      </div>
    );
  }

  // Show message if no tenant is selected
  if (!activeTenant) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-muted-foreground">No tenant selected. Please select a tenant to manage storage.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <FileManager
        files={files}
        isLoading={isLoading}
        onUpload={handleUpload}
        onDelete={handleDelete}
        onRename={handleRename}
        onDownload={handleDownload}
        onSearch={handleSearch}
        uploadProgress={uploadProgress}
        storageInfo={storageInfo || undefined}
      />
    </div>
  );
}
