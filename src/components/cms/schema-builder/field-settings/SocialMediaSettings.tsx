"use client";

import { useState, useEffect } from "react";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { SocialIcon } from "@/components/global/renderIcon";
import { GripVertical } from "lucide-react";
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";

const SOCIAL_PLATFORMS = [
  "facebook", "instagram", "x", "tiktok", "snapchat", "reddit",
  "whatsapp", "telegram", "discord", "slack", "messenger",
  "youtube", "twitch", "github",
] as const;

type PlatformSetting = {
  order: number;
  icon: string;
};

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const result = [...arr];
  const [removed] = result.splice(from, 1);
  result.splice(to, 0, removed);
  return result;
}

function SortablePlatformItem({
  platform,
  index,
  onRemove,
}: {
  platform: PlatformSetting;
  index: number;
  onRemove: (icon: string) => void;
}) {
  const { ref, handleRef, isDragging } = useSortable({
    id: platform.icon,
    index,
  });

  return (
    <div
      ref={ref}
      className="flex items-center gap-2 p-2 border rounded-lg bg-background hover:bg-accent/50"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div ref={handleRef} className="cursor-grab active:cursor-grabbing text-muted-foreground">
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

  useEffect(() => {
    if (!value?.platforms || !Array.isArray(value.platforms)) {
      setSelectedPlatforms([]);
      return;
    }

    if (value.platforms.length > 0 && typeof value.platforms[0] === "object") {
      const settings = (value.platforms as any[]).map((p) => ({
        order: p.order ?? 0,
        icon:  p.icon  ?? p,
      }));
      setSelectedPlatforms(settings);
    } else {
      // Migrate old string[] format
      const migrated = (value.platforms as string[]).map((icon, index) => ({
        order: index,
        icon,
      }));
      setSelectedPlatforms(migrated);
      setValue({ platforms: migrated });
    }
  }, [value]);

  const handlePlatformToggle = (platformIcon: string, checked: boolean) => {
    let updated: PlatformSetting[];

    if (checked) {
      const maxOrder = selectedPlatforms.length > 0
        ? Math.max(...selectedPlatforms.map((p) => p.order))
        : -1;
      updated = [...selectedPlatforms, { order: maxOrder + 1, icon: platformIcon }];
    } else {
      updated = selectedPlatforms
        .filter((p) => p.icon !== platformIcon)
        .map((p, i) => ({ ...p, order: i }));
    }

    setSelectedPlatforms(updated);
    setValue({ platforms: updated });
  };

  const handleDragEnd = ({ operation }: { operation: { source: any; target: any } }) => {
    const { source, target } = operation;
    if (!target || source.id === target.id) return;

    const oldIndex = selectedPlatforms.findIndex((p) => p.icon === source.id);
    const newIndex = selectedPlatforms.findIndex((p) => p.icon === target.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(selectedPlatforms, oldIndex, newIndex);
    const updated = reordered.map((p, i) => ({ ...p, order: i }));

    setSelectedPlatforms(updated);
    setValue({ platforms: updated });
  };

  return (
    <Field>
      <FieldLabel>Select Social Platforms</FieldLabel>

      {selectedPlatforms.length > 0 && (
        <div className="mb-4">
          <FieldLabel className="text-sm mb-2 block">
            Selected Platforms (drag to reorder)
          </FieldLabel>
          <DragDropProvider onDragEnd={handleDragEnd}>
            <div className="space-y-2">
              {[...selectedPlatforms]
                .sort((a, b) => a.order - b.order)
                .map((platform, i) => (
                  <SortablePlatformItem
                    key={platform.icon}
                    platform={platform}
                    index={i}
                    onRemove={(icon) => handlePlatformToggle(icon, false)}
                  />
                ))}
            </div>
          </DragDropProvider>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mt-2">
        {SOCIAL_PLATFORMS.map((platform) => {
          const isSelected = selectedPlatforms.some((p) => p.icon === platform);
          return (
            <div key={platform} className="flex items-center space-x-2">
              <Checkbox
                id={`platform-${platform}`}
                checked={isSelected}
                onCheckedChange={(checked) =>
                  handlePlatformToggle(platform, checked as boolean)
                }
              />
              <label
                htmlFor={`platform-${platform}`}
                className="text-sm font-medium leading-none flex items-center gap-2 cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                <SocialIcon icon={platform as any} className="h-4 w-4" />
                <span className="capitalize">
                  {platform === "x" ? "X (Twitter)" : platform}
                </span>
              </label>
            </div>
          );
        })}
      </div>

      <FieldDescription>
        Select which social media platforms to include. Drag selected platforms to reorder them.
      </FieldDescription>
    </Field>
  );
}