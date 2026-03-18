"use client";

import { useState, useEffect } from "react";
import { FieldComponentProps } from "@/stores/content-editor-store";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SocialIcon } from "@/components/global/renderIcon";

type PlatformSetting = {
  order: number;
  icon: string;
};

type PlatformContent = {
  order: number;
  icon: string;
  href: string;
};

export default function SocialMedia({ field, fieldId, value, handleFieldChange }: FieldComponentProps) {
  // Parse platforms from settings field - handle both old format (strings) and new format (objects)
  const getAvailablePlatforms = (): PlatformSetting[] => {
    if (!field.settings || typeof field.settings !== "object") return [];
    const platforms = (field.settings as Record<string, any>).platforms;
    if (!Array.isArray(platforms)) return [];
    
    // Check if it's the new format (objects) or old format (strings)
    if (platforms.length > 0 && typeof platforms[0] === "object") {
      // New format: array of objects with order and icon
      return (platforms as PlatformSetting[])
        .sort((a, b) => a.order - b.order);
    } else {
      // Old format: array of strings (backward compatibility)
      return (platforms as string[]).map((icon, index) => ({
        order: index,
        icon,
      }));
    }
  };

  const availablePlatforms = getAvailablePlatforms();
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});

  // Initialize social links from value - handle both old format (flat object) and new format (array of objects)
  useEffect(() => {
    const initialLinks: Record<string, string> = {};
    
    // Check if value is the new format (array of objects) or old format (flat object)
    if (value && Array.isArray(value)) {
      // New format: array of objects with order, icon, href
      (value as PlatformContent[]).forEach((platform) => {
        initialLinks[platform.icon] = platform.href || "";
      });
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      // Old format: flat object with platform names as keys
      availablePlatforms.forEach((platform) => {
        initialLinks[platform.icon] = (value as Record<string, string>)[platform.icon] || "";
      });
    } else {
      // No value - initialize with empty strings
      availablePlatforms.forEach((platform) => {
        initialLinks[platform.icon] = "";
      });
    }
    
    setSocialLinks(initialLinks);
  }, [value, JSON.stringify(availablePlatforms)]);

  const handleLinkChange = (platformIcon: string, url: string) => {
    // Update the local state
    const updatedLinks = {
      ...socialLinks,
      [platformIcon]: url,
    };
    setSocialLinks(updatedLinks);
    
    // Build array of objects with order, icon, and href based on availablePlatforms order
    const orderedContent: PlatformContent[] = availablePlatforms.map((platform) => ({
      order: platform.order,
      icon: platform.icon,
      href: updatedLinks[platform.icon] || "",
    }));
    
    handleFieldChange(field.id, orderedContent);
  };

  if (availablePlatforms.length === 0) {
    return (
      <div className="space-y-2">
        <Label>{field.name}</Label>
        <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
          <p className="text-sm">No social platforms configured for this field.</p>
          <p className="text-xs mt-1">Please configure platforms in the schema builder.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Label htmlFor={fieldId}>
        {field.name}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>

      <div className="space-y-3">
        {availablePlatforms.map((platform) => (
          <div key={platform.icon} className="space-y-2">
            <div className="flex items-center gap-2">
              <SocialIcon icon={platform.icon as any} className="h-4 w-4" />
              <Label htmlFor={`${fieldId}-${platform.icon}`} className="text-sm font-medium capitalize">
                {platform.icon === "x" ? "X (Twitter)" : platform.icon.charAt(0).toUpperCase() + platform.icon.slice(1)}
              </Label>
            </div>
            <Input
              id={`${fieldId}-${platform.icon}`}
              type="url"
              placeholder={`https://${platform.icon}.com/your-profile`}
              value={socialLinks[platform.icon] || ""}
              onChange={(e) => handleLinkChange(platform.icon, e.target.value)}
            />
          </div>
        ))}
      </div>

      {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
    </div>
  );
}
