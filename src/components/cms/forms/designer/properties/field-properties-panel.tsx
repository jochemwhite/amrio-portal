import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getFieldTypeDefinition } from "../field-type-registry";
import type { BuilderField } from "../types";

interface FieldPropertiesPanelProps {
  selectedField: BuilderField | null;
  onUpdateField: (id: string, patch: Partial<BuilderField>) => void;
  onRemoveField: (id: string) => void;
}

export function FieldPropertiesPanel({ selectedField, onUpdateField, onRemoveField }: FieldPropertiesPanelProps) {
  if (!selectedField) {
    return <p className="text-sm text-muted-foreground">Select a field in the canvas to edit its properties.</p>;
  }

  const definition = getFieldTypeDefinition(selectedField.type);
  const TypeSettings = definition.SettingsComponent;

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-border/70 bg-background/50 px-3 py-2">
        <p className="text-xs text-muted-foreground">Type</p>
        <div className="mt-1 flex items-center gap-2 text-sm font-medium text-foreground">
          <definition.icon className="h-4 w-4" />
          {definition.label}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Label</label>
        <Input value={selectedField.label} onChange={(event) => onUpdateField(selectedField.id, { label: event.target.value })} />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Key</label>
        <Input value={selectedField.key} onChange={(event) => onUpdateField(selectedField.id, { key: event.target.value })} />
      </div>

      {selectedField.type !== "checkbox" && (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Placeholder</label>
          <Input
            value={selectedField.placeholder ?? ""}
            onChange={(event) => onUpdateField(selectedField.id, { placeholder: event.target.value })}
          />
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Help text</label>
        <Input
          value={selectedField.helpText ?? ""}
          onChange={(event) => onUpdateField(selectedField.id, { helpText: event.target.value })}
        />
      </div>

      {TypeSettings ? (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Type specific settings</p>
          <TypeSettings field={selectedField} onChange={(patch) => onUpdateField(selectedField.id, patch)} />
        </div>
      ) : null}

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={selectedField.required}
          onChange={(event) => onUpdateField(selectedField.id, { required: event.target.checked })}
        />
        Required field
      </label>

      <Button type="button" variant="destructive" className="w-full" onClick={() => onRemoveField(selectedField.id)}>
        Remove Field
      </Button>
    </div>
  );
}
