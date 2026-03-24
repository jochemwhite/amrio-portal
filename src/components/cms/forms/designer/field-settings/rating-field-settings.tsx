import { Input } from "@/components/ui/input";
import type { FieldSettingsProps } from "../types";

function toNumber(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function RatingFieldSettings({ field, onChange }: FieldSettingsProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">Maximum rating</label>
      <Input
        type="number"
        min={1}
        max={10}
        value={field.maxRating ?? 5}
        onChange={(event) => onChange({ maxRating: toNumber(event.target.value) })}
      />
    </div>
  );
}
