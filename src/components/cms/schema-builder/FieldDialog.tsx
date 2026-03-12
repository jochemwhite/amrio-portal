import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface FieldDialogProps {
  isOpen: boolean;
  isEdit: boolean;
  isSaving: boolean;
  formData: any;
  onChange: (data: Partial<any>) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  fieldTypes: { value: string; label: string }[];
}

export function FieldDialog({
  isOpen,
  isEdit,
  isSaving,
  formData,
  onChange,
  onClose,
  onSubmit,
  fieldTypes,
}: FieldDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Field" : "Add New Field"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="field-name">Name *</Label>
            <Input
              id="field-name"
              value={formData.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="Enter field name"
              required
            />
          </div>
          <div>
            <Label htmlFor="field-type">Field Type *</Label>
            <Select value={formData.type} onValueChange={(value) => onChange({ type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select field type" />
              </SelectTrigger>
              <SelectContent>
                {fieldTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="field-required" checked={formData.required} onCheckedChange={(checked) => onChange({ required: checked })} />
            <Label htmlFor="field-required">Required field</Label>
          </div>
          <div>
            <Label htmlFor="field-default">Default Value</Label>
            <Input
              id="field-default"
              value={formData.default_value}
              onChange={(e) => onChange({ default_value: e.target.value })}
              placeholder="Enter default value (optional)"
            />
          </div>
          <div>
            <Label htmlFor="field-validation">Validation Rules</Label>
            <Textarea
              id="field-validation"
              value={formData.validation}
              onChange={(e) => onChange({ validation: e.target.value })}
              placeholder="Enter validation rules (optional)"
              rows={2}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : isEdit ? "Update Field" : "Create Field"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 