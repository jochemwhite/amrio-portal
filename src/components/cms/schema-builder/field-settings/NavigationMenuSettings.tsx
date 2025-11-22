"use client";

import { useState, useEffect } from "react";
import { FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface NavigationMenuSettingsProps {
  value: Record<string, any> | null;
  setValue: (value: Record<string, any> | null, options?: any) => void;
}

export function NavigationMenuSettings({ value, setValue }: NavigationMenuSettingsProps) {
  const [maxDepth, setMaxDepth] = useState<number>(3);
  const [allowExternalLinks, setAllowExternalLinks] = useState<boolean>(true);
  const [allowIcons, setAllowIcons] = useState<boolean>(false);
  const [allowTargetBlank, setAllowTargetBlank] = useState<boolean>(true);
  const [allowCustomClasses, setAllowCustomClasses] = useState<boolean>(false);

  // Initialize from value
  useEffect(() => {
    if (value) {
      setMaxDepth(value.maxDepth ?? 3);
      setAllowExternalLinks(value.allowExternalLinks ?? true);
      setAllowIcons(value.allowIcons ?? false);
      setAllowTargetBlank(value.allowTargetBlank ?? true);
      setAllowCustomClasses(value.allowCustomClasses ?? false);
    }
  }, [value]);

  const handleMaxDepthChange = (newValue: string) => {
    const depth = parseInt(newValue, 10);
    if (isNaN(depth) || depth < 1) return;
    
    const clampedDepth = Math.min(Math.max(depth, 1), 10); // Min 1, Max 10
    setMaxDepth(clampedDepth);
    updateSettings({ maxDepth: clampedDepth });
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    const updates: Record<string, any> = { [field]: checked };
    
    switch (field) {
      case "allowExternalLinks":
        setAllowExternalLinks(checked);
        break;
      case "allowIcons":
        setAllowIcons(checked);
        break;
      case "allowTargetBlank":
        setAllowTargetBlank(checked);
        break;
      case "allowCustomClasses":
        setAllowCustomClasses(checked);
        break;
    }
    
    updateSettings(updates);
  };

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

  return (
    <div className="space-y-6">
      <FormItem>
        <FormLabel>Maximum Menu Depth</FormLabel>
        <Input
          type="number"
          min={1}
          max={10}
          value={maxDepth}
          onChange={(e) => handleMaxDepthChange(e.target.value)}
          className="w-24"
        />
        <FormDescription>
          Maximum number of nested levels allowed (1-10). Default is 3.
        </FormDescription>
      </FormItem>

      <div className="space-y-4">
        <FormLabel>Menu Options</FormLabel>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="allow-external-links"
            checked={allowExternalLinks}
            onCheckedChange={(checked) => handleCheckboxChange("allowExternalLinks", checked as boolean)}
          />
          <label
            htmlFor="allow-external-links"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Allow external links
          </label>
        </div>
        <FormDescription className="ml-6">
          Enable custom URL links in addition to internal pages
        </FormDescription>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="allow-icons"
            checked={allowIcons}
            onCheckedChange={(checked) => handleCheckboxChange("allowIcons", checked as boolean)}
          />
          <label
            htmlFor="allow-icons"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Allow icons
          </label>
        </div>
        <FormDescription className="ml-6">
          Allow adding icon names to menu items
        </FormDescription>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="allow-target-blank"
            checked={allowTargetBlank}
            onCheckedChange={(checked) => handleCheckboxChange("allowTargetBlank", checked as boolean)}
          />
          <label
            htmlFor="allow-target-blank"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Allow opening in new tab
          </label>
        </div>
        <FormDescription className="ml-6">
          Enable option to open links in a new browser tab
        </FormDescription>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="allow-custom-classes"
            checked={allowCustomClasses}
            onCheckedChange={(checked) => handleCheckboxChange("allowCustomClasses", checked as boolean)}
          />
          <label
            htmlFor="allow-custom-classes"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Allow custom CSS classes
          </label>
        </div>
        <FormDescription className="ml-6">
          Enable custom CSS class names for styling menu items
        </FormDescription>
      </div>
    </div>
  );
}




