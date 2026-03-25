"use client";

import { useEffect, useState } from "react";
import { HardDrive } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/supabaseClient";

import { FileArea } from "./FileArea";
import { FolderTree } from "./FolderTree";
import { StorageQuotaBar } from "./StorageQuotaBar";
import { StorageFile, StorageFolder, StorageQuota, StorageViewMode } from "./types";

interface StoragePageClientProps {
  tenantId: string;
  tenantName: string;
  websiteId: string;
  quota: StorageQuota;
  initialRootFolders: StorageFolder[];
  initialRootFiles: StorageFile[];
}

const VIEW_MODE_STORAGE_KEY = "storage-view-mode";

export function StoragePageClient({
  tenantId,
  tenantName,
  websiteId,
  quota,
  initialRootFolders,
  initialRootFiles,
}: StoragePageClientProps) {
  const supabase = createClient();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<StorageViewMode>("grid");
  const [folders, setFolders] = useState<StorageFolder[]>(initialRootFolders);
  const [files, setFiles] = useState<StorageFile[]>(initialRootFiles);
  const [loadingFiles, setLoadingFiles] = useState(false);

  useEffect(() => {
    const savedViewMode = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);

    if (savedViewMode === "grid" || savedViewMode === "list") {
      setViewMode(savedViewMode);
    }
  }, []);

  async function loadFolders() {
    const { data, error } = await supabase
      .from("folders")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("website_id", websiteId)
      .is("deleted_at", null)
      .order("full_path", { ascending: true });

    if (error) {
      toast.error("Failed to load folders.");
      return;
    }

    setFolders(data ?? []);
  }

  async function loadFiles(folderId: string | null) {
    setLoadingFiles(true);

    const query = supabase
      .from("files")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("website_id", websiteId)
      .is("deleted_at", null)
      .eq("upload_status", "confirmed")
      .order("created_at", { ascending: false });

    const { data, error } = await (folderId ? query.eq("folder_id", folderId) : query.is("folder_id", null));
    setLoadingFiles(false);

    if (error) {
      toast.error("Failed to load files.");
      return;
    }

    setFiles(data ?? []);
  }

  useEffect(() => {
    void loadFolders();
  }, [tenantId, websiteId]);

  useEffect(() => {
    void loadFiles(selectedFolderId);
  }, [selectedFolderId, tenantId, websiteId]);

  function handleViewModeChange(nextViewMode: StorageViewMode) {
    setViewMode(nextViewMode);
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, nextViewMode);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <HardDrive className="size-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold tracking-tight">Storage</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage folders and media for {tenantName}.
          {loadingFiles ? " Refreshing files..." : ""}
        </p>
      </div>

      <StorageQuotaBar quota={quota} />

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <FolderTree
          folders={folders}
          selectedFolderId={selectedFolderId}
          onSelectFolder={setSelectedFolderId}
          onFoldersChanged={loadFolders}
          tenantId={tenantId}
          websiteId={websiteId}
        />
        <FileArea
          files={files}
          folders={folders}
          selectedFolderId={selectedFolderId}
          tenantId={tenantId}
          websiteId={websiteId}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onFilesChanged={() => loadFiles(selectedFolderId)}
        />
      </div>
    </div>
  );
}
