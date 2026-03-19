"use client";

import { useState } from "react";
import { Schema } from "@/types/cms";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { deleteSchema } from "@/actions/cms/schema-actions";
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
import { SchemaFormDialog } from "./SchemaFormDialog";

interface SchemaTableProps {
  schemas: Schema[];
  onRefresh?: () => void;
}

export function SchemaTable({ schemas, onRefresh }: SchemaTableProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [schemaToDelete, setSchemaToDelete] = useState<Schema | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [schemaToEdit, setSchemaToEdit] = useState<Schema | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!schemaToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteSchema(schemaToDelete.id);
      if (result.success) {
        toast.success("Schema deleted successfully");
        setDeleteDialogOpen(false);
        setSchemaToDelete(null);
        onRefresh?.();
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete schema");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (schema: Schema) => {
    setSchemaToEdit(schema);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    setSchemaToEdit(null);
    onRefresh?.();
    router.refresh();
  };

  const getFieldCount = (schema: Schema) => {
    if (!schema.cms_schema_sections) return 0;
    return schema.cms_schema_sections.reduce((total, section) => {
      return total + (section.cms_schema_fields?.length || 0);
    }, 0);
  };

  const getSectionCount = (schema: Schema) => {
    return schema.cms_schema_sections?.length || 0;
  };

  const getSchemaTypeMeta = (schemaType: string) => {
    if (schemaType === "page") {
      return { label: "Page", variant: "default" as const };
    }

    if (schemaType === "collection") {
      return { label: "Collection", variant: "secondary" as const };
    }

    if (schemaType === "layout") {
      return { label: "Layout", variant: "outline" as const };
    }

    return { label: schemaType, variant: "secondary" as const };
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Structure</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schemas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No schemas found. Create your first schema to get started.
                </TableCell>
              </TableRow>
            ) : (
              schemas.map((schema) => (
                <TableRow key={schema.id}>
                  <TableCell className="font-medium">{schema.name}</TableCell>
                  <TableCell className="max-w-md truncate">
                    {schema.description || <span className="text-muted-foreground italic">No description</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getSchemaTypeMeta(String(schema.schema_type)).variant}>
                      {getSchemaTypeMeta(String(schema.schema_type)).label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{getSectionCount(schema)} sections</span>
                      <span>•</span>
                      <span>{getFieldCount(schema)} fields</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {schema.created_at ? formatDistanceToNow(new Date(schema.created_at), { addSuffix: true }) : "Unknown"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/dashboard/admin/schemas/${schema.id}`)}
                        title="Edit schema structure"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(schema)} title="Edit schema details">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSchemaToDelete(schema);
                          setDeleteDialogOpen(true);
                        }}
                        title="Delete schema"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the schema &quot;{schemaToDelete?.name}&quot;. This action cannot be undone and will affect all pages using this
              schema.
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

      {/* Edit Dialog */}
      <SchemaFormDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} schema={schemaToEdit} onSuccess={handleEditSuccess} />
    </>
  );
}
