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
  "linkedin",
  "whatsapp",
  "telegram",
  "discord",
  "slack",
  "messenger",
  "youtube",
  "twitch",
  "github",
] as const;

// Sortable platform item component
function SortablePlatformItem({ platform, onRemove }: { platform: string; onRemove: (platform: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: platform });

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
      <SocialIcon icon={platform as any} className="h-4 w-4" />
      <span className="text-sm font-medium capitalize flex-1">
        {platform === "x" ? "X (Twitter)" : platform}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0"
        onClick={() => onRemove(platform)}
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
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  // Initialize from value
  useEffect(() => {
    if (value?.platforms && Array.isArray(value.platforms)) {
      setSelectedPlatforms(value.platforms);
    } else {
      setSelectedPlatforms([]);
    }
  }, [value]);

  const handlePlatformToggle = (platform: string, checked: boolean) => {
    const updated = checked
      ? [...selectedPlatforms, platform]
      : selectedPlatforms.filter((p) => p !== platform);
    setSelectedPlatforms(updated);
    setValue({ platforms: updated });
  };

  const handlePlatformDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = selectedPlatforms.indexOf(active.id as string);
    const newIndex = selectedPlatforms.indexOf(over.id as string);
    const reordered = arrayMove(selectedPlatforms, oldIndex, newIndex);
    setSelectedPlatforms(reordered);
    setValue({ platforms: reordered });
  };

  return (
    <FormItem>
      <FormLabel>Select Social Platforms</FormLabel>
      
      {/* Selected platforms - sortable list */}
      {selectedPlatforms.length > 0 && (
        <div className="mb-4">
          <FormLabel className="text-sm mb-2 block">Selected Platforms (drag to reorder)</FormLabel>
          <DndContext collisionDetection={closestCenter} onDragEnd={handlePlatformDragEnd}>
            <SortableContext items={selectedPlatforms} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {selectedPlatforms.map((platform) => (
                  <SortablePlatformItem
                    key={platform}
                    platform={platform}
                    onRemove={(p) => handlePlatformToggle(p, false)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Available platforms - checkbox grid */}
      <div className="grid grid-cols-2 gap-3 mt-2">
        {SOCIAL_PLATFORMS.map((platform) => (
          <div key={platform} className="flex items-center space-x-2">
            <Checkbox
              id={`platform-${platform}`}
              checked={selectedPlatforms.includes(platform)}
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
        ))}
      </div>
      <FormDescription>
        Select which social media platforms to include. Drag selected platforms to reorder them.
      </FormDescription>
    </FormItem>
  );
}

