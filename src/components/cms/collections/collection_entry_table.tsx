"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Pencil, Trash } from "lucide-react";
import { CollectionEntry, deleteCollectionEntry, updateCollectionEntry } from "@/actions/cms/collection-entry-actions";
import { toast } from "sonner";
import { format } from "date-fns";
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
import { CollectionEntryFormDialog } from "./collection_entry_form_dialog";

interface CollectionEntryTableProps {
  entries: CollectionEntry[];
  collectionId: string;
  onEntryDeleted: (entryId: string) => void;
  onEntryUpdated: (entry: CollectionEntry) => void;
}

export function CollectionEntryTable({
  entries,
  collectionId,
  onEntryDeleted,
  onEntryUpdated,
}: CollectionEntryTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<CollectionEntry | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleDelete = async () => {
    if (!entryToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteCollectionEntry(entryToDelete);
      if (result.success) {
        toast.success("Entry deleted successfully");
        onEntryDeleted(entryToDelete);
        setDeleteDialogOpen(false);
      } else {
        toast.error(result.error || "Failed to delete entry");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
      setEntryToDelete(null);
    }
  };

  const handleUpdate = async (name: string) => {
    if (!entryToEdit) return;

    setIsUpdating(true);
    try {
      const result = await updateCollectionEntry(entryToEdit.id, { name });
      if (result.success && result.data) {
        toast.success("Entry updated successfully");
        onEntryUpdated(result.data);
        setEditDialogOpen(false);
        setEntryToEdit(null);
      } else {
        toast.error(result.error || "Failed to update entry");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  const openDeleteDialog = (entryId: string) => {
    setEntryToDelete(entryId);
    setDeleteDialogOpen(true);
  };

  const openEditDialog = (entry: CollectionEntry) => {
    setEntryToEdit(entry);
    setEditDialogOpen(true);
  };

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/dashboard/collections/${collectionId}/entries/${entry.id}`}
                    className="hover:underline"
                  >
                    {entry.name || "Untitled Entry"}
                  </Link>
                </TableCell>
                <TableCell>
                  {format(new Date(entry.created_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/collections/${collectionId}/entries/${entry.id}`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Content
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditDialog(entry)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openDeleteDialog(entry.id)}
                        className="text-destructive"
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CollectionEntryFormDialog
        key={`${entryToEdit?.id ?? "none"}-${editDialogOpen ? "open" : "closed"}`}
        isOpen={editDialogOpen}
        onClose={() => {
          if (!isUpdating) {
            setEditDialogOpen(false);
            setEntryToEdit(null);
          }
        }}
        onSubmit={handleUpdate}
        isSubmitting={isUpdating}
        title="Rename Entry"
        description="Update the name of this entry."
        submitLabel="Save"
        submittingLabel="Saving..."
        initialName={entryToEdit?.name}
      />
    </>
  );
}
