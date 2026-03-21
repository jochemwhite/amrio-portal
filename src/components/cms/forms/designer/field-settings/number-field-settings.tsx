import { Input } from "@/components/ui/input";
import type { FieldSettingsProps } from "../types";

function toNumber(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function NumberFieldSettings({ field, onChange }: FieldSettingsProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Min</label>
        <Input
          type="number"
          value={field.min ?? ""}
          onChange={(event) => onChange({ min: toNumber(event.target.value) })}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Max</label>
        <Input
          type="number"
          value={field.max ?? ""}
          onChange={(event) => onChange({ max: toNumber(event.target.value) })}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Step</label>
        <Input
          type="number"
          value={field.step ?? ""}
          onChange={(event) => onChange({ step: toNumber(event.target.value) })}
        />
      </div>
    </div>
  );
}
