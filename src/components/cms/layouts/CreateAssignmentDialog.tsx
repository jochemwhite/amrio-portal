"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { LayoutAssignment, LayoutConditionType } from "@/types/cms";
import { Database } from "@/types/supabase";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

type Page = Database["public"]["Tables"]["cms_pages"]["Row"];

interface CreateAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    condition_type: LayoutConditionType;
    condition_value: any;
    priority: number;
  }) => Promise<void>;
  onUpdate: (
    assignmentId: string,
    data: { condition_type?: LayoutConditionType; condition_value?: any; priority?: number }
  ) => Promise<void>;
  availablePages: Page[];
  existingAssignment: LayoutAssignment | null;
  maxPriority: number;
}

export function CreateAssignmentDialog({
  isOpen,
  onClose,
  onCreate,
  onUpdate,
  availablePages,
  existingAssignment,
  maxPriority,
}: CreateAssignmentDialogProps) {
  const [conditionType, setConditionType] = useState<LayoutConditionType>("all_pages");
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const [urlPattern, setUrlPattern] = useState("");
  const [priority, setPriority] = useState(maxPriority + 1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset or populate form when dialog opens/closes or assignment changes
  useEffect(() => {
    if (existingAssignment) {
      setConditionType(existingAssignment.condition_type);
      setPriority(existingAssignment.priority);

      if (existingAssignment.condition_type === "specific_pages") {
        setSelectedPageIds(existingAssignment.condition_value?.page_ids || []);
      } else if (existingAssignment.condition_type === "page_pattern") {
        setUrlPattern(existingAssignment.condition_value?.pattern || "");
      }
    } else {
      setConditionType("all_pages");
      setSelectedPageIds([]);
      setUrlPattern("");
      setPriority(maxPriority + 1);
    }
  }, [existingAssignment, maxPriority, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate based on condition type
    if (conditionType === "specific_pages" && selectedPageIds.length === 0) {
      toast.error("Please select at least one page");
      return;
    }

    if (conditionType === "page_pattern" && !urlPattern.trim()) {
      toast.error("Please enter a URL pattern");
      return;
    }

    setIsSubmitting(true);

    try {
      let conditionValue: any;

      switch (conditionType) {
        case "all_pages":
          conditionValue = {};
          break;
        case "specific_pages":
          conditionValue = { page_ids: selectedPageIds };
          break;
        case "page_pattern":
          conditionValue = { pattern: urlPattern.trim() };
          break;
      }

      if (existingAssignment) {
        await onUpdate(existingAssignment.id, {
          condition_type: conditionType,
          condition_value: conditionValue,
          priority,
        });
      } else {
        await onCreate({
          condition_type: conditionType,
          condition_value: conditionValue,
          priority,
        });
      }
    } catch (error) {
      console.error("Error submitting assignment:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePageSelection = (pageId: string) => {
    setSelectedPageIds((prev) =>
      prev.includes(pageId) ? prev.filter((id) => id !== pageId) : [...prev, pageId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {existingAssignment ? "Edit Assignment" : "Create Assignment"}
            </DialogTitle>
            <DialogDescription>
              Configure when this template should be displayed based on page conditions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Condition Type */}
            <div className="space-y-2">
              <Label htmlFor="condition-type">Condition Type *</Label>
              <Select value={conditionType} onValueChange={(v) => setConditionType(v as LayoutConditionType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_pages">All Pages</SelectItem>
                  <SelectItem value="specific_pages">Specific Pages</SelectItem>
                  <SelectItem value="page_pattern">URL Pattern (Regex)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {conditionType === "all_pages" && "This template will be applied to every page"}
                {conditionType === "specific_pages" && "Select specific pages where this template should appear"}
                {conditionType === "page_pattern" && "Use a regular expression to match page URLs"}
              </p>
            </div>

            {/* Specific Pages Selection */}
            {conditionType === "specific_pages" && (
              <div className="space-y-2">
                <Label>Select Pages *</Label>
                <ScrollArea className="h-48 border rounded-md p-4">
                  {availablePages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No pages available. Create pages first.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {availablePages.map((page) => (
                        <div key={page.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`page-${page.id}`}
                            checked={selectedPageIds.includes(page.id)}
                            onCheckedChange={() => togglePageSelection(page.id)}
                          />
                          <Label
                            htmlFor={`page-${page.id}`}
                            className="text-sm font-normal cursor-pointer flex-1"
                          >
                            {page.name}
                            <span className="text-muted-foreground ml-2">({page.slug})</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                <p className="text-xs text-muted-foreground">
                  Selected: {selectedPageIds.length} page(s)
                </p>
              </div>
            )}

            {/* URL Pattern */}
            {conditionType === "page_pattern" && (
              <div className="space-y-2">
                <Label htmlFor="url-pattern">URL Pattern (Regex) *</Label>
                <Input
                  id="url-pattern"
                  placeholder="e.g., ^/blog/.*"
                  value={urlPattern}
                  onChange={(e) => setUrlPattern(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter a regular expression to match page slugs. Example: <code>^/blog/.*</code>{" "}
                  matches all blog pages
                </p>
              </div>
            )}

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                type="number"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                min={0}
              />
              <p className="text-xs text-muted-foreground">
                Higher values take precedence. Suggested: {maxPriority + 1}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : existingAssignment
                ? "Update Assignment"
                : "Create Assignment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


