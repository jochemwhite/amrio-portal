"use client";

import React from "react";
import { CollectionPicker } from "@/components/cms/collections/CollectionPicker";
import { getActiveWebsiteIdClient } from "@/lib/utils/active-website-client";

export default function Reference({ field, fieldId, value, error, handleFieldChange, handleFieldBlur }: any) {
  const websiteId = getActiveWebsiteIdClient();

  if (!websiteId) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          No active website selected. Please select a website to use collection references.
        </p>
      </div>
    );
  }

  return (
    <CollectionPicker
      field={field}
      fieldId={fieldId}
      value={value}
      error={error}
      handleFieldChange={handleFieldChange}
      handleFieldBlur={handleFieldBlur}
      websiteId={websiteId}
    />
  );
}