"use client";

import { useState } from "react";
import { LayoutAssignment, LayoutTemplate, LayoutConditionType } from "@/types/cms";
import { Database } from "@/types/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, GripVertical, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  createLayoutAssignment,
  updateLayoutAssignment,
  deleteLayoutAssignment,
} from "@/actions/cms/layout-actions";
import { toast } from "sonner";
import { CreateAssignmentDialog } from "./CreateAssignmentDialog";
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
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Page = Database["public"]["Tables"]["cms_pages"]["Row"];

interface AssignmentManagerProps {
  websiteId: string;
  templateId: string;
  template: LayoutTemplate;
  initialAssignments: LayoutAssignment[];
  availablePages: Page[];
}

export function AssignmentManager({
  websiteId,
  templateId,
  template,
  initialAssignments,
  availablePages,
}: AssignmentManagerProps) {
  const [assignments, setAssignments] = useState<LayoutAssignment[]>(initialAssignments);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<LayoutAssignment | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = async (data: {
    condition_type: LayoutConditionType;
    condition_value: any;
    priority: number;
  }) => {
    const result = await createLayoutAssignment({
      template_id: templateId,
      website_id: websiteId,
      ...data,
    });

    if (result.success && result.data) {
      setAssignments([...assignments, result.data]);
      toast.success("Assignment created successfully");
      setIsCreateDialogOpen(false);
    } else {
      toast.error(result.error || "Failed to create assignment");
    }
  };

  const handleUpdate = async (
    assignmentId: string,
    data: { condition_type?: LayoutConditionType; condition_value?: any; priority?: number }
  ) => {
    const result = await updateLayoutAssignment(assignmentId, data);

    if (result.success && result.data) {
      setAssignments(assignments.map((a) => (a.id === assignmentId ? result.data! : a)));
      toast.success("Assignment updated successfully");
      setEditingAssignment(null);
    } else {
      toast.error(result.error || "Failed to update assignment");
    }
  };

  const handleDelete = async (assignmentId: string) => {
    const result = await deleteLayoutAssignment(assignmentId);

    if (result.success) {
      setAssignments(assignments.filter((a) => a.id !== assignmentId));
      toast.success("Assignment deleted successfully");
      setDeletingId(null);
    } else {
      toast.error(result.error || "Failed to delete assignment");
    }
  };

  const getConditionDescription = (assignment: LayoutAssignment) => {
    switch (assignment.condition_type) {
      case "all_pages":
        return "Applied to all pages";
      case "specific_pages":
        const pageIds = assignment.condition_value?.page_ids || [];
        const pageNames = pageIds
          .map((id: string) => availablePages.find((p) => p.id === id)?.name)
          .filter(Boolean);
        return `Applied to ${pageNames.length} specific page(s): ${pageNames.slice(0, 2).join(", ")}${
          pageNames.length > 2 ? "..." : ""
        }`;
      case "page_pattern":
        return `Applied to pages matching pattern: ${assignment.condition_value?.pattern || "N/A"}`;
      default:
        return "Unknown condition";
    }
  };

  const sortedAssignments = [...assignments].sort((a, b) => b.priority - a.priority);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/websites/${websiteId}/layouts`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Templates
          </Button>
        </Link>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Assignments determine when this {template.type} template is displayed. Higher priority
          assignments take precedence. If no assignments match, the default {template.type} will be
          used.
        </AlertDescription>
      </Alert>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Assignment Rules</h2>
          <p className="text-sm text-muted-foreground">
            {assignments.length} rule(s) configured
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Assignment
        </Button>
      </div>

      {sortedAssignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No assignment rules configured. This template will only be used if set as default or
              manually overridden.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Assignment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedAssignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground mt-1" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base capitalize">
                          {assignment.condition_type.replace(/_/g, " ")}
                        </CardTitle>
                        <Badge variant="secondary">Priority: {assignment.priority}</Badge>
                      </div>
                      <CardDescription>{getConditionDescription(assignment)}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingAssignment(assignment)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingId(assignment.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <CreateAssignmentDialog
        isOpen={isCreateDialogOpen || editingAssignment !== null}
        onClose={() => {
          setIsCreateDialogOpen(false);
          setEditingAssignment(null);
        }}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        availablePages={availablePages}
        existingAssignment={editingAssignment}
        maxPriority={Math.max(...assignments.map((a) => a.priority), -1)}
      />

      <AlertDialog open={deletingId !== null} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this assignment rule. The template will no longer be automatically
              applied based on this condition.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDelete(deletingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


