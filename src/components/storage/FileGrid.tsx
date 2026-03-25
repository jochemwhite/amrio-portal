"use client";

import Image from "next/image";
import { MoreHorizontal, MoveRight, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getPublicUrl } from "@/lib/r2/urls";

import { StorageFile, StorageFolder } from "./types";
import { formatBytes, getFileIcon, isImageFile } from "./utils";

interface FileGridProps {
  files: StorageFile[];
  folders: StorageFolder[];
  onOpenFile: (file: StorageFile) => void;
  onCopyUrl: (file: StorageFile) => void;
  onMoveFile: (file: StorageFile, folderId: string | null) => void;
  onDeleteFile: (file: StorageFile) => void;
}

export function FileGrid({
  files,
  folders,
  onOpenFile,
  onCopyUrl,
  onMoveFile,
  onDeleteFile,
}: FileGridProps) {
  if (files.length === 0) {
    return (
      <Empty className="rounded-2xl border bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MoveRight />
          </EmptyMedia>
          <EmptyTitle>No files in this view</EmptyTitle>
          <EmptyDescription>
            Upload new assets or switch folders to see what is already stored here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {files.map((file) => {
        const FileIcon = getFileIcon(file);
        const publicUrl = getPublicUrl(file.storage_path);

        return (
          <Card
            key={file.id}
            className="group cursor-pointer overflow-hidden rounded-2xl transition-shadow hover:shadow-md"
            onClick={() => onOpenFile(file)}
          >
            <div className="relative aspect-square overflow-hidden bg-muted/40">
              {isImageFile(file) ? (
                <Image
                  src={publicUrl}
                  alt={file.original_filename}
                  fill
                  className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <FileIcon className="size-12 text-muted-foreground" />
                </div>
              )}

              <div className="absolute right-3 top-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(event) => event.stopPropagation()}>
                    <Button variant="secondary" size="icon" className="size-8 rounded-full shadow-sm">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                    <DropdownMenuItem
                      onClick={(event) => {
                        event.stopPropagation();
                        onCopyUrl(file);
                      }}
                    >
                      Copy URL
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger onClick={(event) => event.stopPropagation()}>
                        Move to folder
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem
                          onClick={(event) => {
                            event.stopPropagation();
                            onMoveFile(file, null);
                          }}
                        >
                          Root
                        </DropdownMenuItem>
                        {folders.map((folder) => (
                          <DropdownMenuItem
                            key={folder.id}
                            onClick={(event) => {
                              event.stopPropagation();
                              onMoveFile(file, folder.id);
                            }}
                          >
                            {folder.full_path}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteFile(file);
                      }}
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <CardContent className="space-y-1 p-4">
              <p className="truncate font-medium">{file.original_filename}</p>
              <p className="text-sm text-muted-foreground">{formatBytes(file.size_bytes)}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
