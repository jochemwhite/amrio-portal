"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LayoutTemplate, LayoutTemplateType } from "@/types/cms";
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Star, 
  Settings, 
  Copy,
  FileEdit,
  LayoutTemplate as LayoutIcon 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteLayoutTemplate, updateLayoutTemplate } from "@/actions/cms/layout-actions";
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

interface LayoutTemplateCardProps {
  template: LayoutTemplate;
  websiteId: string;
  onDeleted: (templateId: string, type: LayoutTemplateType) => void;
  onUpdated: (template: LayoutTemplate) => void;
}

export function LayoutTemplateCard({ 
  template, 
  websiteId, 
  onDeleted, 
  onUpdated 
}: LayoutTemplateCardProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleEditSchema = () => {
    router.push(`/dashboard/websites/${websiteId}/layouts/${template.id}/schema`);
  };

  const handleEditContent = () => {
    router.push(`/dashboard/websites/${websiteId}/layouts/${template.id}/content`);
  };

  const handleManageAssignments = () => {
    router.push(`/dashboard/websites/${websiteId}/layouts/${template.id}/assignments`);
  };

  const handleSetAsDefault = async () => {
    setIsUpdating(true);
    try {
      const result = await updateLayoutTemplate(template.id, { is_default: true });
      
      if (result.success && result.data) {
        toast.success(`${template.type === 'header' ? 'Header' : 'Footer'} set as default`);
        onUpdated(result.data);
      } else {
        toast.error(result.error || "Failed to set as default");
      }
    } catch (error) {
      toast.error("An error occurred while updating the template");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteLayoutTemplate(template.id);
      
      if (result.success) {
        toast.success(`${template.type === 'header' ? 'Header' : 'Footer'} deleted successfully`);
        onDeleted(template.id, template.type);
        setIsDeleteDialogOpen(false);
      } else {
        toast.error(result.error || "Failed to delete template");
      }
    } catch (error) {
      toast.error("An error occurred while deleting the template");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="relative hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <LayoutIcon className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">{template.name}</CardTitle>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEditSchema}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Schema
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleEditContent}>
                  <FileEdit className="mr-2 h-4 w-4" />
                  Edit Content
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleManageAssignments}>
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Assignments
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {!template.is_default && (
                  <DropdownMenuItem onClick={handleSetAsDefault} disabled={isUpdating}>
                    <Star className="mr-2 h-4 w-4" />
                    Set as Default
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {template.description && (
            <CardDescription>{template.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {template.is_default && (
              <Badge variant="default">
                <Star className="mr-1 h-3 w-3" />
                Default
              </Badge>
            )}
            <Badge variant="outline" className="capitalize">
              {template.type}
            </Badge>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={handleEditSchema}
          >
            <Edit className="mr-2 h-4 w-4" />
            Schema
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="flex-1"
            onClick={handleEditContent}
          >
            <FileEdit className="mr-2 h-4 w-4" />
            Content
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the {template.type} template "{template.name}".
              This action cannot be undone.
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
    </>
  );
}


