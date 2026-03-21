import { Input } from "@/components/ui/input";
import type { FieldSettingsProps } from "../types";

export function CheckboxFieldSettings({ field, onChange }: FieldSettingsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Checked value</label>
        <Input
          value={field.checkedValue ?? "true"}
          onChange={(event) => onChange({ checkedValue: event.target.value || undefined })}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Unchecked value</label>
        <Input
          value={field.uncheckedValue ?? "false"}
          onChange={(event) => onChange({ uncheckedValue: event.target.value || undefined })}
        />
      </div>
    </div>
  );
}
