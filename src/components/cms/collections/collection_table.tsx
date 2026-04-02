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
import { MoreHorizontal, Pencil, Trash, List } from "lucide-react";
import { CollectionWithSchema, deleteCollection } from "@/actions/cms/collection-actions";
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
import { CollectionFormDialog } from "./collection_form_dialog";

interface CollectionTableProps {
  collections: CollectionWithSchema[];
  websiteId: string;
  onCollectionDeleted: (collectionId: string) => void;
  onCollectionUpdated: (collection: CollectionWithSchema) => void;
}

export function CollectionTable({ collections, websiteId, onCollectionDeleted, onCollectionUpdated }: CollectionTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [collectionToEdit, setCollectionToEdit] = useState<CollectionWithSchema | null>(null);

  const handleDelete = async () => {
    if (!collectionToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteCollection(collectionToDelete);
      if (result.success) {
        toast.success("Collection deleted successfully");
        onCollectionDeleted(collectionToDelete);
        setDeleteDialogOpen(false);
      } else {
        toast.error(result.error || "Failed to delete collection");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
      setCollectionToDelete(null);
    }
  };

  const openDeleteDialog = (collectionId: string) => {
    setCollectionToDelete(collectionId);
    setDeleteDialogOpen(true);
  };

  const openEditDialog = (collection: CollectionWithSchema) => {
    setCollectionToEdit(collection);
    setEditDialogOpen(true);
  };

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Schema</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {collections.map((collection) => (
              <TableRow key={collection.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/dashboard/collections/${collection.id}/entries`}
                    className="hover:underline"
                  >
                    {collection.name}
                  </Link>
                </TableCell>
                <TableCell>
                  {collection.description || (
                    <span className="text-muted-foreground italic">No description</span>
                  )}
                </TableCell>
                <TableCell>
                  {collection.cms_schemas?.name || (
                    <span className="text-muted-foreground italic">No schema</span>
                  )}
                </TableCell>
                <TableCell>
                  {format(new Date(collection.created_at), "MMM d, yyyy")}
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
                        <Link href={`/dashboard/collections/${collection.id}/entries`}>
                        <List className="mr-2 h-4 w-4" />
                        View Entries
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openEditDialog(collection)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Name
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openDeleteDialog(collection.id)}
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
            <AlertDialogTitle>Delete Collection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this collection? This will also delete all entries
              and their content. This action cannot be undone.
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

      <CollectionFormDialog
        key={`${collectionToEdit?.id ?? "none"}-${editDialogOpen ? "open" : "closed"}`}
        isOpen={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setCollectionToEdit(null);
        }}
        onSuccess={(updatedCollection) => {
          onCollectionUpdated({ ...collectionToEdit, ...updatedCollection } as CollectionWithSchema);
          setEditDialogOpen(false);
          setCollectionToEdit(null);
        }}
        websiteId={websiteId}
        collection={collectionToEdit}
      />
    </>
  );
}
