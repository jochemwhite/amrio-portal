import { Input } from "@/components/ui/input";
import type { FieldSettingsProps } from "../types";

export function FileFieldSettings({ field, onChange }: FieldSettingsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Accepted types</label>
        <Input
          value={field.accept ?? ""}
          placeholder="image/*,.pdf"
          onChange={(event) => onChange({ accept: event.target.value || undefined })}
        />
      </div>
      <label className="flex items-center gap-2 pt-6 text-sm text-foreground">
        <input
          type="checkbox"
          checked={field.multiple ?? false}
          onChange={(event) => onChange({ multiple: event.target.checked })}
        />
        Allow multiple files
      </label>
    </div>
  );
}
