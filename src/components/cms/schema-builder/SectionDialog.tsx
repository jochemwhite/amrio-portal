import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SectionDialogProps {
  isOpen: boolean;
  isEdit: boolean;
  isSaving: boolean;
  formData: { name: string; description: string };
  onChange: (data: Partial<{ name: string; description: string }>) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function SectionDialog({
  isOpen,
  isEdit,
  isSaving,
  formData,
  onChange,
  onClose,
  onSubmit,
}: SectionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Section" : "Add New Section"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="section-name">Name *</Label>
            <Input
              id="section-name"
              value={formData.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="Enter section name"
              required
            />
          </div>
          <div>
            <Label htmlFor="section-description">Description</Label>
            <Textarea
              id="section-description"
              value={formData.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Enter section description (optional)"
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : isEdit ? "Update Section" : "Create Section"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 