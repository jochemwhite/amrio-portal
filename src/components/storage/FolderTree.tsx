"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderPlus,
  FolderTree as FolderTreeIcon,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";

import { createFolder, deleteFolder, renameFolder } from "@/lib/actions/media";

import { StorageFolder } from "./types";

interface FolderTreeProps {
  folders: StorageFolder[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onFoldersChanged: () => Promise<void>;
  tenantId: string;
  websiteId: string;
}

export function FolderTree({
  folders,
  selectedFolderId,
  onSelectFolder,
  onFoldersChanged,
  tenantId,
  websiteId,
}: FolderTreeProps) {
  const router = useRouter();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [folderToDelete, setFolderToDelete] = useState<StorageFolder | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});

  const childrenByParentId = useMemo(() => {
    const map = new Map<string | null, StorageFolder[]>();

    for (const folder of folders) {
      const key = folder.parent_folder_id;
      const current = map.get(key) ?? [];
      current.push(folder);
      map.set(key, current);
    }

    for (const entry of map.values()) {
      entry.sort((a, b) => a.name.localeCompare(b.name));
    }

    return map;
  }, [folders]);

  const rootFolders = childrenByParentId.get(null) ?? [];

  async function refreshFolders() {
    await onFoldersChanged();
    router.refresh();
  }

  async function handleCreateFolder() {
    try {
      setSubmitting(true);
      await createFolder(newFolderName, selectedFolderId ?? undefined, tenantId, websiteId);
      toast.success("Folder created successfully.");
      setNewFolderName("");
      setCreateDialogOpen(false);
      await refreshFolders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create folder.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRenameFolder(folderId: string) {
    try {
      setSubmitting(true);
      await renameFolder(folderId, renameValue);
      toast.success("Folder renamed successfully.");
      setRenamingFolderId(null);
      setRenameValue("");
      await refreshFolders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to rename folder.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteFolder() {
    if (!folderToDelete) {
      return;
    }

    try {
      setSubmitting(true);
      await deleteFolder(folderToDelete.id);
      toast.success("Folder deleted successfully.");
      if (selectedFolderId === folderToDelete.id) {
        onSelectFolder(null);
      }
      setFolderToDelete(null);
      await refreshFolders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete folder.");
    } finally {
      setSubmitting(false);
    }
  }

  function renderFolderNode(folder: StorageFolder, depth: number) {
    const childFolders = childrenByParentId.get(folder.id) ?? [];
    const isSelected = selectedFolderId === folder.id;
    const isOpen = openFolders[folder.id] ?? isSelected;
    const isRenaming = renamingFolderId === folder.id;

    return (
      <Collapsible
        key={folder.id}
        open={childFolders.length > 0 ? isOpen : false}
        onOpenChange={(nextOpen) =>
          setOpenFolders((current) => ({ ...current, [folder.id]: nextOpen }))
        }
      >
        <ContextMenu>
          <ContextMenuTrigger>
            <div className="space-y-1">
              <div
                className={`group flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm transition-colors ${
                  isSelected ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                }`}
                style={{ paddingLeft: `${depth * 14 + 8}px` }}
              >
                {childFolders.length > 0 ? (
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6 shrink-0 rounded-full"
                    >
                      {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                    </Button>
                  </CollapsibleTrigger>
                ) : (
                  <span className="size-6 shrink-0" />
                )}

                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  onClick={() => onSelectFolder(folder.id)}
                >
                  <Folder className="size-4 shrink-0 text-muted-foreground" />
                  {isRenaming ? (
                    <Input
                      value={renameValue}
                      onChange={(event) => setRenameValue(event.target.value)}
                      onBlur={() => void handleRenameFolder(folder.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void handleRenameFolder(folder.id);
                        }

                        if (event.key === "Escape") {
                          setRenamingFolderId(null);
                          setRenameValue("");
                        }
                      }}
                      autoFocus
                      className="h-8"
                    />
                  ) : (
                    <span className="truncate">{folder.name}</span>
                  )}
                </button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => {
                    setRenamingFolderId(folder.id);
                    setRenameValue(folder.name);
                  }}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </div>

              {childFolders.length > 0 ? (
                <CollapsibleContent className="space-y-1">
                  {childFolders.map((child) => renderFolderNode(child, depth + 1))}
                </CollapsibleContent>
              ) : null}
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem
              onSelect={() => {
                setRenamingFolderId(folder.id);
                setRenameValue(folder.name);
              }}
            >
              <Pencil className="size-4" />
              Rename
            </ContextMenuItem>
            <ContextMenuItem
              variant="destructive"
              onSelect={() => setFolderToDelete(folder)}
            >
              <Trash2 className="size-4" />
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </Collapsible>
    );
  }

  return (
    <>
      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Folders</CardTitle>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <FolderPlus className="mr-2 size-4" />
            New Folder
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            type="button"
            variant={selectedFolderId === null ? "secondary" : "ghost"}
            className="w-full justify-start rounded-xl"
            onClick={() => onSelectFolder(null)}
          >
            <FolderTreeIcon className="mr-2 size-4" />
            Root
          </Button>

          {rootFolders.length > 0 ? (
            <div className="space-y-1">
              {rootFolders.map((folder) => renderFolderNode(folder, 0))}
            </div>
          ) : (
            <Empty className="rounded-xl border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FolderTreeIcon />
                </EmptyMedia>
                <EmptyTitle>No folders yet</EmptyTitle>
                <EmptyDescription>
                  Start with a root folder to keep assets organized by section or campaign.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={() => setCreateDialogOpen(true)}>Create your first folder</Button>
              </EmptyContent>
            </Empty>
          )}
        </CardContent>
      </Card>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              value={newFolderName}
              onChange={(event) => setNewFolderName(event.target.value)}
              placeholder="Brand assets"
            />
            <p className="text-sm text-muted-foreground">
              {selectedFolderId
                ? "This folder will be created inside the selected folder."
                : "This folder will be created at the root level."}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleCreateFolder()} disabled={submitting}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(folderToDelete)}
        onOpenChange={(open) => !open && setFolderToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete folder?</AlertDialogTitle>
            <AlertDialogDescription>
              This will soft delete the folder. Empty the folder and its subfolders first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void handleDeleteFolder()}>
              Delete folder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
