"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderPlus, FolderTree as FolderTreeIcon, Pencil, Trash2 } from "lucide-react";
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
import { Tree, type TreeViewElement } from "@/components/ui/file-tree";

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

const ROOT_TREE_ID = "__root__";

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
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [folderToDelete, setFolderToDelete] = useState<StorageFolder | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedFolder = folders.find((folder) => folder.id === selectedFolderId) ?? null;

  const treeElements = useMemo<TreeViewElement[]>(() => {
    const byParent = new Map<string | null, StorageFolder[]>();

    for (const folder of folders) {
      const siblings = byParent.get(folder.parent_folder_id) ?? [];
      siblings.push(folder);
      byParent.set(folder.parent_folder_id, siblings);
    }

    const buildChildren = (parentId: string | null): TreeViewElement[] => {
      const childFolders = byParent.get(parentId) ?? [];

      return childFolders
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((folder) => ({
          id: folder.id,
          name: folder.name,
          type: "folder",
          children: buildChildren(folder.id),
        }));
    };

    return [
      {
        id: ROOT_TREE_ID,
        name: "Root",
        type: "folder",
        children: buildChildren(null),
      },
    ];
  }, [folders]);

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

  async function handleRenameFolder() {
    if (!selectedFolder) {
      return;
    }

    try {
      setSubmitting(true);
      await renameFolder(selectedFolder.id, renameValue);
      toast.success("Folder renamed successfully.");
      setRenameDialogOpen(false);
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

  return (
    <>
      <Card className="rounded-2xl">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">Folders</CardTitle>
            <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
              <FolderPlus className="mr-2 size-4" />
              New Folder
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!selectedFolder}
              onClick={() => {
                if (!selectedFolder) return;
                setRenameValue(selectedFolder.name);
                setRenameDialogOpen(true);
              }}
            >
              <Pencil className="mr-2 size-4" />
              Rename
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!selectedFolder}
              onClick={() => selectedFolder && setFolderToDelete(selectedFolder)}
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            {selectedFolder
              ? `Selected: ${selectedFolder.full_path}`
              : "Selected: Root"}
          </p>
        </CardHeader>
        <CardContent>
          {folders.length > 0 ? (
            <Tree
              key={selectedFolderId ?? ROOT_TREE_ID}
              className="h-[420px]"
              elements={treeElements}
              initialExpandedItems={[ROOT_TREE_ID]}
              initialSelectedId={selectedFolderId ?? ROOT_TREE_ID}
              onSelectChange={(id) => onSelectFolder(id === ROOT_TREE_ID ? null : id)}
            />
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

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              placeholder="New folder name"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleRenameFolder()} disabled={submitting || !selectedFolder}>
              Save
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
