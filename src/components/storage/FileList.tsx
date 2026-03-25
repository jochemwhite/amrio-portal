"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ArrowUpDown, MoreHorizontal, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPublicUrl } from "@/lib/r2/urls";

import { StorageFile, StorageFolder } from "./types";
import { formatBytes, formatDate, getFileIcon, getFileTypeLabel, isImageFile } from "./utils";

type SortKey = "name" | "size" | "created_at";
type SortDirection = "asc" | "desc";

interface FileListProps {
  files: StorageFile[];
  folders: StorageFolder[];
  onOpenFile: (file: StorageFile) => void;
  onCopyUrl: (file: StorageFile) => void;
  onMoveFile: (file: StorageFile, folderId: string | null) => void;
  onDeleteFile: (file: StorageFile) => void;
}

export function FileList({
  files,
  folders,
  onOpenFile,
  onCopyUrl,
  onMoveFile,
  onDeleteFile,
}: FileListProps) {
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const sortedFiles = useMemo(() => {
    return [...files].sort((left, right) => {
      let comparison = 0;

      if (sortKey === "name") {
        comparison = left.original_filename.localeCompare(right.original_filename);
      } else if (sortKey === "size") {
        comparison = left.size_bytes - right.size_bytes;
      } else {
        comparison =
          new Date(left.created_at ?? 0).getTime() - new Date(right.created_at ?? 0).getTime();
      }

      return sortDirection === "asc" ? comparison : comparison * -1;
    });
  }, [files, sortDirection, sortKey]);

  function toggleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection(nextKey === "name" ? "asc" : "desc");
  }

  if (sortedFiles.length === 0) {
    return (
      <Empty className="rounded-2xl border bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ArrowUpDown />
          </EmptyMedia>
          <EmptyTitle>No files to list</EmptyTitle>
          <EmptyDescription>
            Upload a file to this folder or adjust your search to see matching assets.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Preview</TableHead>
            <TableHead>
              <Button variant="ghost" className="-ml-3 px-3" onClick={() => toggleSort("name")}>
                Name
                <ArrowUpDown className="ml-2 size-4" />
              </Button>
            </TableHead>
            <TableHead>Type</TableHead>
            <TableHead>
              <Button variant="ghost" className="-ml-3 px-3" onClick={() => toggleSort("size")}>
                Size
                <ArrowUpDown className="ml-2 size-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" className="-ml-3 px-3" onClick={() => toggleSort("created_at")}>
                Uploaded
                <ArrowUpDown className="ml-2 size-4" />
              </Button>
            </TableHead>
            <TableHead className="w-[80px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedFiles.map((file) => {
            const FileIcon = getFileIcon(file);
            const publicUrl = getPublicUrl(file.storage_path);

            return (
              <TableRow key={file.id} className="cursor-pointer" onClick={() => onOpenFile(file)}>
                <TableCell>
                  {isImageFile(file) ? (
                    <div className="relative size-12 overflow-hidden rounded-xl border">
                      <Image
                        src={publicUrl}
                        alt={file.original_filename}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex size-12 items-center justify-center rounded-xl border bg-muted/40">
                      <FileIcon className="size-5 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="max-w-[280px] truncate font-medium">
                  {file.original_filename}
                </TableCell>
                <TableCell>{getFileTypeLabel(file)}</TableCell>
                <TableCell>{formatBytes(file.size_bytes)}</TableCell>
                <TableCell>{formatDate(file.created_at)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(event) => event.stopPropagation()}>
                      <Button variant="ghost" size="icon">
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
