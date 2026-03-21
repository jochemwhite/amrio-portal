import { Input } from "@/components/ui/input";
import type { FieldSettingsProps } from "../types";

export function DateFieldSettings({ field, onChange }: FieldSettingsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Earliest date</label>
        <Input
          type="date"
          value={field.minDate ?? ""}
          onChange={(event) => onChange({ minDate: event.target.value || undefined })}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Latest date</label>
        <Input
          type="date"
          value={field.maxDate ?? ""}
          onChange={(event) => onChange({ maxDate: event.target.value || undefined })}
        />
      </div>
    </div>
  );
}
