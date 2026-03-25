"use client";

import { useState } from "react";
import Image from "next/image";
import { Copy, Trash2 } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { deleteFile, moveFile } from "@/lib/actions/media";
import { getPublicUrl } from "@/lib/r2/urls";

import { StorageFile, StorageFolder } from "./types";
import { formatBytes, formatDate, getFileIcon, getFileTypeLabel, isImageFile } from "./utils";

interface FileDetailSheetProps {
  file: StorageFile | null;
  folders: StorageFolder[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFilesChanged: () => Promise<void>;
}

export function FileDetailSheet({
  file,
  folders,
  open,
  onOpenChange,
  onFilesChanged,
}: FileDetailSheetProps) {
  const copyToClipboard = useCopyToClipboard();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!file) {
    return null;
  }

  const currentFile = file;
  const publicUrl = getPublicUrl(file.storage_path);
  const FileIcon = getFileIcon(file);

  async function handleDelete() {
    try {
      setSubmitting(true);
      await deleteFile(currentFile.id);
      toast.success("File deleted successfully.");
      setDeleteDialogOpen(false);
      onOpenChange(false);
      await onFilesChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete file.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMove(targetFolderId: string) {
    try {
      setSubmitting(true);
      await moveFile(currentFile.id, targetFolderId === "root" ? null : targetFolderId);
      toast.success("File moved successfully.");
      await onFilesChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to move file.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="truncate">{file.original_filename}</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <div className="overflow-hidden rounded-2xl border bg-muted/40">
              {isImageFile(file) ? (
                <div className="relative aspect-video w-full">
                  <Image
                    src={publicUrl}
                    alt={file.original_filename}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center">
                  <FileIcon className="size-14 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="grid gap-4 rounded-2xl border p-4">
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium">{getFileTypeLabel(file)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Size</p>
                <p className="font-medium">{formatBytes(file.size_bytes)}</p>
              </div>
              {file.width && file.height ? (
                <div>
                  <p className="text-sm text-muted-foreground">Dimensions</p>
                  <p className="font-medium">{file.width} × {file.height}</p>
                </div>
              ) : null}
              <div>
                <p className="text-sm text-muted-foreground">Uploaded</p>
                <p className="font-medium">{formatDate(file.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Storage path</p>
                <p className="break-all font-mono text-sm">{file.storage_path}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Public URL</p>
                <p className="break-all font-mono text-sm">{publicUrl}</p>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border p-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Move to folder</p>
                <Select defaultValue={file.folder_id ?? "root"} onValueChange={(value) => void handleMove(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a folder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="root">Root</SelectItem>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.full_path}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => void copyToClipboard(publicUrl, "File URL")}
                >
                  <Copy className="mr-2 size-4" />
                  Copy URL
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={submitting}
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this file?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the file from Cloudflare R2 and soft deletes its database record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void handleDelete()}>
              Delete file
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
