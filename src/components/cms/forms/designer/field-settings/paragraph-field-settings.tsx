import { Textarea } from "@/components/ui/textarea";
import type { FieldSettingsProps } from "../types";

export function ParagraphFieldSettings({ field, onChange }: FieldSettingsProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">Content</label>
      <Textarea
        rows={6}
        value={field.content ?? ""}
        onChange={(event) => onChange({ content: event.target.value })}
      />
    </div>
  );
}
