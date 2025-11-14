"use client";

import { useState, useEffect } from "react";
import { FieldComponentProps } from "@/stores/useContentEditorStore";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SocialIcon } from "@/components/global/renderIcon";

export default function SocialMedia({ field, fieldId, value, handleFieldChange }: FieldComponentProps) {
  // Parse platforms from settings field
  const getAvailablePlatforms = (): string[] => {
    if (!field.settings || typeof field.settings !== "object") return [];
    const platforms = (field.settings as Record<string, any>).platforms;
    return Array.isArray(platforms) ? platforms : [];
  };

  const availablePlatforms = getAvailablePlatforms();
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});

  // Initialize social links from value or empty object
  useEffect(() => {
    const initialLinks: Record<string, string> = {};
    // Initialize all available platforms with empty strings
    availablePlatforms.forEach((platform) => {
      initialLinks[platform] = "";
    });
    
    // Merge with existing value if it's an object
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.keys(value).forEach((platform) => {
        if (availablePlatforms.includes(platform)) {
          initialLinks[platform] = (value as Record<string, string>)[platform] || "";
        }
      });
    }
    
    setSocialLinks(initialLinks);
  }, [value, JSON.stringify(availablePlatforms)]);

  const handleLinkChange = (platform: string, url: string) => {
    const updatedLinks = {
      ...socialLinks,
      [platform]: url,
    };
    setSocialLinks(updatedLinks);
    handleFieldChange(field.id, updatedLinks);
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
          <div key={platform} className="space-y-2">
            <div className="flex items-center gap-2">
              <SocialIcon icon={platform as any} className="h-4 w-4" />
              <Label htmlFor={`${fieldId}-${platform}`} className="text-sm font-medium capitalize">
                {platform === "x" ? "X (Twitter)" : platform.charAt(0).toUpperCase() + platform.slice(1)}
              </Label>
            </div>
            <Input
              id={`${fieldId}-${platform}`}
              type="url"
              placeholder={`https://${platform}.com/your-profile`}
              value={socialLinks[platform] || ""}
              onChange={(e) => handleLinkChange(platform, e.target.value)}
            />
          </div>
        ))}
      </div>

      {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
    </div>
  );
}

