"use client";

import { useMemo, useRef, useState } from "react";
import { Grid2X2, List, Search, Upload } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import { deleteFile, moveFile } from "@/lib/actions/media";
import { getPublicUrl } from "@/lib/r2/urls";

import { FileDetailSheet } from "./FileDetailSheet";
import { FileGrid } from "./FileGrid";
import { FileList } from "./FileList";
import { StorageFile, StorageFolder, StorageViewMode } from "./types";

interface FileAreaProps {
  files: StorageFile[];
  folders: StorageFolder[];
  selectedFolderId: string | null;
  tenantId: string;
  websiteId: string;
  viewMode: StorageViewMode;
  onViewModeChange: (viewMode: StorageViewMode) => void;
  onFilesChanged: () => Promise<void>;
}

export function FileArea({
  files,
  folders,
  selectedFolderId,
  tenantId,
  websiteId,
  viewMode,
  onViewModeChange,
  onFilesChanged,
}: FileAreaProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const copyToClipboard = useCopyToClipboard();
  const { uploadFile, progress, error, reset } = useMediaUpload();
  const [search, setSearch] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<StorageFile | null>(null);
  const [fileToDelete, setFileToDelete] = useState<StorageFile | null>(null);

  const filteredFiles = useMemo(() => {
    if (!search) {
      return files;
    }

    const query = search.toLowerCase();
    return files.filter((file) =>
      file.original_filename.toLowerCase().includes(query),
    );
  }, [files, search]);

  const progressValue =
    progress === "uploading" ? 65 : progress === "confirming" ? 92 : 0;

  async function handleUpload(selectedFiles: globalThis.FileList | File[]) {
    try {
      reset();

      for (const file of Array.from(selectedFiles)) {
        await uploadFile(
          file,
          tenantId,
          websiteId,
          selectedFolderId ?? undefined,
        );
      }

      toast.success("Upload completed successfully.");
      await onFilesChanged();
    } catch (caughtError) {
      toast.error(
        caughtError instanceof Error ? caughtError.message : "Upload failed.",
      );
    }
  }

  async function handleMoveFile(file: StorageFile, folderId: string | null) {
    try {
      await moveFile(file.id, folderId);
      toast.success("File moved successfully.");
      await onFilesChanged();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to move file.",
      );
    }
  }

  async function handleDeleteFile() {
    if (!fileToDelete) {
      return;
    }

    try {
      await deleteFile(fileToDelete.id);
      toast.success("File deleted successfully.");
      setFileToDelete(null);
      setSelectedFile(null);
      await onFilesChanged();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete file.",
      );
    }
  }

  return (
    <>
      <Card
        className={`rounded-2xl transition-colors ${isDragging ? "border-primary bg-primary/5" : ""}`}
      >
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle className="text-base">
                {selectedFolderId ? "Folder contents" : "All root files"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Drag files anywhere into this area to upload them directly to
                storage.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative min-w-[220px] flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search files"
                  className="pl-9"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "outline"}
                  size="icon"
                  onClick={() => onViewModeChange("grid")}
                >
                  <Grid2X2 className="size-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "outline"}
                  size="icon"
                  onClick={() => onViewModeChange("list")}
                >
                  <List className="size-4" />
                </Button>
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 size-4" />
                  Upload
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    if (event.target.files) {
                      void handleUpload(event.target.files);
                      event.target.value = "";
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {progress === "uploading" || progress === "confirming" || error ? (
            <div className="space-y-2 rounded-xl border bg-muted/40 p-3">
              {progress === "uploading" || progress === "confirming" ? (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span>
                      {progress === "uploading"
                        ? "Uploading to server"
                        : "Confirming upload"}
                    </span>
                    <span>{progressValue}%</span>
                  </div>
                  <Progress value={progressValue} className="h-2" />
                </>
              ) : null}
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}
            </div>
          ) : null}
        </CardHeader>

        <CardContent
          className="min-h-[460px]"
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            if (event.currentTarget === event.target) {
              setIsDragging(false);
            }
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            if (event.dataTransfer.files.length > 0) {
              void handleUpload(event.dataTransfer.files);
            }
          }}
        >
          {viewMode === "grid" ? (
            <FileGrid
              files={filteredFiles}
              folders={folders}
              onOpenFile={setSelectedFile}
              onCopyUrl={(file) =>
                void copyToClipboard(
                  getPublicUrl(file.storage_path),
                  "File URL",
                )
              }
              onMoveFile={(file, folderId) =>
                void handleMoveFile(file, folderId)
              }
              onDeleteFile={setFileToDelete}
            />
          ) : (
            <FileList
              files={filteredFiles}
              folders={folders}
              onOpenFile={setSelectedFile}
              onCopyUrl={(file) =>
                void copyToClipboard(
                  getPublicUrl(file.storage_path),
                  "File URL",
                )
              }
              onMoveFile={(file, folderId) =>
                void handleMoveFile(file, folderId)
              }
              onDeleteFile={setFileToDelete}
            />
          )}
        </CardContent>
      </Card>

      <FileDetailSheet
        file={selectedFile}
        folders={folders}
        open={Boolean(selectedFile)}
        onOpenChange={(open) => !open && setSelectedFile(null)}
        onFilesChanged={onFilesChanged}
      />

      <AlertDialog
        open={Boolean(fileToDelete)}
        onOpenChange={(open) => !open && setFileToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this file?</AlertDialogTitle>
            <AlertDialogDescription>
              The file will be removed from Cloudflare R2 and disappear from
              this dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => void handleDeleteFile()}
            >
              Delete file
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
