import { Textarea } from "@/components/ui/textarea";
import type { FieldSettingsProps } from "../types";

export function SelectFieldSettings({ field, onChange }: FieldSettingsProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">Options (one per line)</label>
      <Textarea
        rows={6}
        value={(field.options ?? []).join("\n")}
        onChange={(event) =>
          onChange({
            options: event.target.value
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean),
          })
        }
      />
    </div>
  );
}
