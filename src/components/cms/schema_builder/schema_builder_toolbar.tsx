"use client";

import { Plus, Save, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SchemaBuilderToolbar({
  canAddSection = true,
  hasChanges,
  isSaving,
  onAddSection,
  onReset,
  onSave,
}: {
  canAddSection?: boolean;
  hasChanges: boolean;
  isSaving: boolean;
  onAddSection: () => void;
  onReset: () => void;
  onSave: () => void;
}) {
  return (
    <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="lg"
          className="gap-2 px-4  hover:bg-white/18 disabled:bg-white/8 disabled:text-slate-500"
          disabled={!hasChanges || isSaving}
          onClick={onSave}
        >
          <Save className="size-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="gap-2  border-white/10 bg-transparent px-4 text-slate-300 hover:bg-white/5 hover:text-white disabled:text-slate-600"
          disabled={!hasChanges || isSaving}
          onClick={onReset}
        >
          <Undo2 className="size-4" />
          Reset
        </Button>
      </div>
      <Button
        variant="outline"
        size="lg"
        className="h-12 gap-2 border-white/12 bg-white/2 px-4 text-white hover:bg-white/6"
        disabled={!canAddSection || isSaving}
        onClick={onAddSection}
      >
        <Plus className="size-4" />
        Add Section
      </Button>
    </section>
  );
}
