import { Input } from "@/components/ui/input";
import type { FieldSettingsProps } from "../types";

function toNumber(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function HeadingFieldSettings({ field, onChange }: FieldSettingsProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">Heading level</label>
      <Input
        type="number"
        min={1}
        max={6}
        value={field.headingLevel ?? 2}
        onChange={(event) => onChange({ headingLevel: toNumber(event.target.value) })}
      />
    </div>
  );
}
