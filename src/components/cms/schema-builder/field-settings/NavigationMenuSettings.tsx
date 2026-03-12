"use client";

import { useState, useEffect } from "react";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface NavigationMenuSettingsProps {
  value: Record<string, any> | null;
  setValue: (value: Record<string, any> | null, options?: any) => void;
}

const CHECKBOXES = [
  {
    id:    "allow-external-links",
    field: "allowExternalLinks",
    label: "Allow external links",
    description: "Enable custom URL links in addition to internal pages",
  },
  {
    id:    "allow-icons",
    field: "allowIcons",
    label: "Allow icons",
    description: "Allow adding icon names to menu items",
  },
  {
    id:    "allow-target-blank",
    field: "allowTargetBlank",
    label: "Allow opening in new tab",
    description: "Enable option to open links in a new browser tab",
  },
  {
    id:    "allow-custom-classes",
    field: "allowCustomClasses",
    label: "Allow custom CSS classes",
    description: "Enable custom CSS class names for styling menu items",
  },
] as const;

type CheckboxField = typeof CHECKBOXES[number]["field"];

export function NavigationMenuSettings({ value, setValue }: NavigationMenuSettingsProps) {
  const [maxDepth,           setMaxDepth]           = useState<number>(3);
  const [allowExternalLinks, setAllowExternalLinks] = useState<boolean>(true);
  const [allowIcons,         setAllowIcons]         = useState<boolean>(false);
  const [allowTargetBlank,   setAllowTargetBlank]   = useState<boolean>(true);
  const [allowCustomClasses, setAllowCustomClasses] = useState<boolean>(false);

  const stateMap: Record<CheckboxField, boolean> = {
    allowExternalLinks,
    allowIcons,
    allowTargetBlank,
    allowCustomClasses,
  };

  const setterMap: Record<CheckboxField, (v: boolean) => void> = {
    allowExternalLinks: setAllowExternalLinks,
    allowIcons:         setAllowIcons,
    allowTargetBlank:   setAllowTargetBlank,
    allowCustomClasses: setAllowCustomClasses,
  };

  useEffect(() => {
    if (!value) return;
    setMaxDepth(value.maxDepth ?? 3);
    setAllowExternalLinks(value.allowExternalLinks ?? true);
    setAllowIcons(value.allowIcons ?? false);
    setAllowTargetBlank(value.allowTargetBlank ?? true);
    setAllowCustomClasses(value.allowCustomClasses ?? false);
  }, [value]);

  const updateSettings = (updates: Record<string, any>) => {
    setValue({
      maxDepth,
      allowExternalLinks,
      allowIcons,
      allowTargetBlank,
      allowCustomClasses,
      ...updates,
    });
  };

  const handleMaxDepthChange = (val: string) => {
    const depth = parseInt(val, 10);
    if (isNaN(depth) || depth < 1) return;
    const clamped = Math.min(Math.max(depth, 1), 10);
    setMaxDepth(clamped);
    updateSettings({ maxDepth: clamped });
  };

  const handleCheckboxChange = (field: CheckboxField, checked: boolean) => {
    setterMap[field](checked);
    updateSettings({ [field]: checked });
  };

  return (
    <div className="space-y-6">

      {/* Max depth */}
      <Field>
        <FieldLabel htmlFor="max-depth">Maximum Menu Depth</FieldLabel>
        <Input
          id="max-depth"
          type="number"
          min={1}
          max={10}
          value={maxDepth}
          onChange={(e) => handleMaxDepthChange(e.target.value)}
          className="w-24"
        />
        <FieldDescription>
          Maximum number of nested levels allowed (1–10). Default is 3.
        </FieldDescription>
      </Field>

      {/* Checkboxes */}
      <Field>
        <FieldLabel>Menu Options</FieldLabel>
        <div className="space-y-4 mt-1">
          {CHECKBOXES.map(({ id, field, label, description }) => (
            <div key={id} className="space-y-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={id}
                  checked={stateMap[field]}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange(field, checked as boolean)
                  }
                />
                <label
                  htmlFor={id}
                  className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {label}
                </label>
              </div>
              <FieldDescription className="ml-6">{description}</FieldDescription>
            </div>
          ))}
        </div>
      </Field>

    </div>
  );
}