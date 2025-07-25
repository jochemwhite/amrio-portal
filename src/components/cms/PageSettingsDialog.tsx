import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PageSettingsDialogProps {
  isOpen: boolean;
  isSaving: boolean;
  formData: { 
    name: string; 
    description: string; 
    slug: string; 
    status: string; 
  };
  onChange: (data: Partial<{ name: string; description: string; slug: string; status: string }>) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function PageSettingsDialog({
  isOpen,
  isSaving,
  formData,
  onChange,
  onClose,
  onSubmit,
}: PageSettingsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Page Settings</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="page-name">Page Name *</Label>
            <Input
              id="page-name"
              value={formData.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="Enter page name"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="page-slug">Slug *</Label>
            <Input
              id="page-slug"
              value={formData.slug}
              onChange={(e) => onChange({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
              placeholder="page-url-slug"
              required
            />
            <p className="text-xs text-gray-500 mt-1">This will be the URL path: /{formData.slug}</p>
          </div>

          <div>
            <Label htmlFor="page-description">Description</Label>
            <Textarea
              id="page-description"
              value={formData.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Enter page description (optional)"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="page-status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => onChange({ status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Updating..." : "Update Page"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 