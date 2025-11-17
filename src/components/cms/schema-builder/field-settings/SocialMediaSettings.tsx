"use client";

import { useState, useEffect } from "react";
import { FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { SocialIcon } from "@/components/global/renderIcon";
import { GripVertical } from "lucide-react";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Available social media platforms
const SOCIAL_PLATFORMS = [
  "facebook",
  "instagram",
  "x",
  "tiktok",
  "snapchat",
  "reddit",
  "whatsapp",
  "telegram",
  "discord",
  "slack",
  "messenger",
  "youtube",
  "twitch",
  "github",
] as const;

// Platform type definition for settings (only order and icon)
type PlatformSetting = {
  order: number;
  icon: string;
};

// Sortable platform item component
function SortablePlatformItem({ platform, onRemove }: { platform: PlatformSetting; onRemove: (icon: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: platform.icon });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 border rounded-lg bg-background hover:bg-accent/50"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground">
        <GripVertical className="h-4 w-4" />
      </div>
      <SocialIcon icon={platform.icon as any} className="h-4 w-4" />
      <span className="text-sm font-medium capitalize flex-1">
        {platform.icon === "x" ? "X (Twitter)" : platform.icon}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0"
        onClick={() => onRemove(platform.icon)}
      >
        ×
      </Button>
    </div>
  );
}

interface SocialMediaSettingsProps {
  value: Record<string, any> | null;
  setValue: (value: Record<string, any> | null, options?: any) => void;
}

export function SocialMediaSettings({ value, setValue }: SocialMediaSettingsProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformSetting[]>([]);

  // Initialize from value - handle both old format (strings) and new format (objects)
  useEffect(() => {
    if (value?.platforms && Array.isArray(value.platforms)) {
      // Check if it's the new format (objects) or old format (strings)
      if (value.platforms.length > 0 && typeof value.platforms[0] === "object") {
        // New format: array of objects - extract only order and icon (ignore href if present)
        const settings = (value.platforms as any[]).map((p) => ({
          order: p.order ?? 0,
          icon: p.icon ?? p,
        }));
        setSelectedPlatforms(settings);
      } else {
        // Old format: array of strings - migrate to new format
        const migrated = (value.platforms as string[]).map((icon, index) => ({
          order: index,
          icon,
        }));
        setSelectedPlatforms(migrated);
        setValue({ platforms: migrated });
      }
    } else {
      setSelectedPlatforms([]);
    }
  }, [value, setValue]);

  const handlePlatformToggle = (platformIcon: string, checked: boolean) => {
    let updated: PlatformSetting[];
    if (checked) {
      // Add new platform
      const maxOrder = selectedPlatforms.length > 0 
        ? Math.max(...selectedPlatforms.map(p => p.order))
        : -1;
      updated = [
        ...selectedPlatforms,
        { order: maxOrder + 1, icon: platformIcon }
      ];
    } else {
      // Remove platform and reorder remaining ones
      updated = selectedPlatforms
        .filter((p) => p.icon !== platformIcon)
        .map((p, index) => ({ ...p, order: index }));
    }
    setSelectedPlatforms(updated);
    setValue({ platforms: updated });
  };

  const handlePlatformDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = selectedPlatforms.findIndex((p) => p.icon === active.id);
    const newIndex = selectedPlatforms.findIndex((p) => p.icon === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    const reordered = arrayMove(selectedPlatforms, oldIndex, newIndex);
    // Update order property to match new indices
    const updated = reordered.map((platform, index) => ({
      ...platform,
      order: index,
    }));
    setSelectedPlatforms(updated);
    setValue({ platforms: updated });
  };

  return (
    <FormItem>
      <FormLabel>Select Social Platforms</FormLabel>
      
      {/* Selected platforms - sortable list */}
      {selectedPlatforms.length > 0 && (
        <div className="mb-4">
          <FormLabel className="text-sm mb-2 block">Selected Platforms (drag to reorder)</FormLabel>
          <DndContext collisionDetection={closestCenter} onDragEnd={handlePlatformDragEnd}>
            <SortableContext 
              items={selectedPlatforms.map(p => p.icon)} 
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {selectedPlatforms
                  .sort((a, b) => a.order - b.order)
                  .map((platform) => (
                    <SortablePlatformItem
                      key={platform.icon}
                      platform={platform}
                      onRemove={(icon) => handlePlatformToggle(icon, false)}
                    />
                  ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Available platforms - checkbox grid */}
      <div className="grid grid-cols-2 gap-3 mt-2">
        {SOCIAL_PLATFORMS.map((platform) => {
          const isSelected = selectedPlatforms.some((p) => p.icon === platform);
          return (
            <div key={platform} className="flex items-center space-x-2">
              <Checkbox
                id={`platform-${platform}`}
                checked={isSelected}
                onCheckedChange={(checked) => handlePlatformToggle(platform, checked as boolean)}
              />
              <label
                htmlFor={`platform-${platform}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer"
              >
                <SocialIcon icon={platform as any} className="h-4 w-4" />
                <span className="capitalize">{platform === "x" ? "X (Twitter)" : platform}</span>
              </label>
            </div>
          );
        })}
      </div>
      <FormDescription>
        Select which social media platforms to include. Drag selected platforms to reorder them.
      </FormDescription>
    </FormItem>
  );
}

