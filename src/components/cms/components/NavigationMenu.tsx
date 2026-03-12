"use client";

import { useState } from "react";
import { FieldComponentProps } from "@/stores/useContentEditorStore";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, Plus } from "lucide-react";
import { MenuItem } from "@/types/cms";
import { NavigationMenuEditorDialog } from "./NavigationMenuEditorDialog";

export default function NavigationMenu({ field, fieldId, value, handleFieldChange }: FieldComponentProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Parse settings
  const settings = (field.settings as Record<string, any>) || {};
  const maxDepth = settings.maxDepth ?? 3;
  const allowExternalLinks = settings.allowExternalLinks ?? true;
  const allowIcons = settings.allowIcons ?? false;
  const allowTargetBlank = settings.allowTargetBlank ?? true;
  const allowCustomClasses = settings.allowCustomClasses ?? false;

  // Parse current menu items
  const menuItems: MenuItem[] = Array.isArray(value) ? value : [];

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleSaveMenu = (items: MenuItem[]) => {
    handleFieldChange(field.id, items);
    setIsDialogOpen(false);
  };

  // Count total items including nested ones
  const countItems = (items: MenuItem[]): number => {
    return items.reduce((count, item) => {
      return count + 1 + (item.children ? countItems(item.children) : 0);
    }, 0);
  };

  const totalItems = countItems(menuItems);

  return (
    <div className="space-y-4">
      <Label htmlFor={fieldId}>
        {field.name}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>

      {field.description && (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      )}

      {/* Current menu summary */}
      <div className="rounded-lg border border-dashed p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Menu className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                {totalItems === 0 ? "No menu items" : `${totalItems} menu item${totalItems === 1 ? "" : "s"}`}
              </p>
              <p className="text-xs text-muted-foreground">
                {menuItems.length === 0
                  ? "Click to build your navigation menu"
                  : `${menuItems.length} top-level item${menuItems.length === 1 ? "" : "s"}`}
              </p>
            </div>
          </div>

          <Button type="button" variant="outline" onClick={handleOpenDialog}>
            {totalItems === 0 ? (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Menu
              </>
            ) : (
              <>
                <Menu className="h-4 w-4 mr-2" />
                Edit Menu
              </>
            )}
          </Button>
        </div>

        {/* Show top-level items preview */}
        {menuItems.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Top-level items:</p>
            <div className="flex flex-wrap gap-2">
              {menuItems.slice(0, 5).map((item) => (
                <Badge key={item.id} variant="secondary" className="text-xs">
                  {item.label}
                  {item.children && item.children.length > 0 && (
                    <span className="ml-1 text-muted-foreground">({item.children.length})</span>
                  )}
                </Badge>
              ))}
              {menuItems.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{menuItems.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Menu Editor Dialog */}
      <NavigationMenuEditorDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        menuItems={menuItems}
        onSave={handleSaveMenu}
        settings={{
          maxDepth,
          allowExternalLinks,
          allowIcons,
          allowTargetBlank,
          allowCustomClasses,
        }}
      />
    </div>
  );
}




