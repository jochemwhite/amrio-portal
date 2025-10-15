"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface SchemaSettingsDialogProps {
  isOpen: boolean;
  isSaving: boolean;
  formData: {
    name: string;
    description: string;
    template: boolean;
  };
  onChange: (data: Partial<{ name: string; description: string; template: boolean }>) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function SchemaSettingsDialog({
  isOpen,
  isSaving,
  formData,
  onChange,
  onClose,
  onSubmit,
}: SchemaSettingsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Schema Settings</DialogTitle>
            <DialogDescription>
              Update the schema name, description, and template status.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="schema-name">Name</Label>
              <Input
                id="schema-name"
                value={formData.name}
                onChange={(e) => onChange({ name: e.target.value })}
                placeholder="Schema name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schema-description">Description</Label>
              <Textarea
                id="schema-description"
                value={formData.description}
                onChange={(e) => onChange({ description: e.target.value })}
                placeholder="Schema description"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="schema-template">Template Schema</Label>
                <p className="text-sm text-muted-foreground">
                  Mark this schema as a reusable template
                </p>
              </div>
              <Switch
                id="schema-template"
                checked={formData.template}
                onCheckedChange={(checked) => onChange({ template: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

