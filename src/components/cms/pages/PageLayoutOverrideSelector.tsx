"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LayoutTemplate, PageLayoutOverride } from "@/types/cms";
import {
  setPageLayoutOverride,
  clearPageLayoutOverride,
  getLayoutTemplatesByWebsite,
} from "@/actions/cms/layout-actions";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface PageLayoutOverrideSelectorProps {
  pageId: string;
  websiteId: string;
  initialOverride: PageLayoutOverride | null;
}

export function PageLayoutOverrideSelector({
  pageId,
  websiteId,
  initialOverride,
}: PageLayoutOverrideSelectorProps) {
  const [headerTemplates, setHeaderTemplates] = useState<LayoutTemplate[]>([]);
  const [footerTemplates, setFooterTemplates] = useState<LayoutTemplate[]>([]);
  const [selectedHeaderId, setSelectedHeaderId] = useState<string | null>(
    initialOverride?.header_template_id || null
  );
  const [selectedFooterId, setSelectedFooterId] = useState<string | null>(
    initialOverride?.footer_template_id || null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, [websiteId]);

  useEffect(() => {
    // Check if there are unsaved changes
    const headerChanged = selectedHeaderId !== (initialOverride?.header_template_id || null);
    const footerChanged = selectedFooterId !== (initialOverride?.footer_template_id || null);
    setHasChanges(headerChanged || footerChanged);
  }, [selectedHeaderId, selectedFooterId, initialOverride]);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const [headersResult, footersResult] = await Promise.all([
        getLayoutTemplatesByWebsite(websiteId, "header"),
        getLayoutTemplatesByWebsite(websiteId, "footer"),
      ]);

      if (headersResult.success) {
        setHeaderTemplates(headersResult.data || []);
      }

      if (footersResult.success) {
        setFooterTemplates(footersResult.data || []);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await setPageLayoutOverride({
        page_id: pageId,
        header_template_id: selectedHeaderId,
        footer_template_id: selectedFooterId,
      });

      if (result.success) {
        toast.success("Layout override saved successfully");
        setHasChanges(false);
      } else {
        toast.error(result.error || "Failed to save override");
      }
    } catch (error) {
      console.error("Error saving override:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    setIsSaving(true);
    try {
      const result = await clearPageLayoutOverride(pageId);

      if (result.success) {
        toast.success("Layout override cleared");
        setSelectedHeaderId(null);
        setSelectedFooterId(null);
        setHasChanges(false);
      } else {
        toast.error(result.error || "Failed to clear override");
      }
    } catch (error) {
      console.error("Error clearing override:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSelectedHeaderId(initialOverride?.header_template_id || null);
    setSelectedFooterId(initialOverride?.footer_template_id || null);
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const defaultHeader = headerTemplates.find((t) => t.is_default);
  const defaultFooter = footerTemplates.find((t) => t.is_default);

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Override the default header and footer for this specific page. If no override is set, the
          page will use the default templates or assignment rules configured for your website.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Header Override */}
        <Card>
          <CardHeader>
            <CardTitle>Header Template</CardTitle>
            <CardDescription>
              Override the header template for this page
              {defaultHeader && (
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    Default: {defaultHeader.name}
                  </Badge>
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="header-template">Select Header</Label>
              <Select
                value={selectedHeaderId || "default"}
                onValueChange={(value) => setSelectedHeaderId(value === "default" ? null : value)}
              >
                <SelectTrigger id="header-template">
                  <SelectValue placeholder="Use default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Use Default</SelectItem>
                  {headerTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                      {template.is_default && " (Default)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedHeaderId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedHeaderId(null)}
                className="w-full"
              >
                <X className="mr-2 h-4 w-4" />
                Clear Override
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Footer Override */}
        <Card>
          <CardHeader>
            <CardTitle>Footer Template</CardTitle>
            <CardDescription>
              Override the footer template for this page
              {defaultFooter && (
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    Default: {defaultFooter.name}
                  </Badge>
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="footer-template">Select Footer</Label>
              <Select
                value={selectedFooterId || "default"}
                onValueChange={(value) => setSelectedFooterId(value === "default" ? null : value)}
              >
                <SelectTrigger id="footer-template">
                  <SelectValue placeholder="Use default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Use Default</SelectItem>
                  {footerTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                      {template.is_default && " (Default)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedFooterId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFooterId(null)}
                className="w-full"
              >
                <X className="mr-2 h-4 w-4" />
                Clear Override
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        {(selectedHeaderId || selectedFooterId) && (
          <Button variant="outline" onClick={handleClear} disabled={isSaving}>
            Clear All Overrides
          </Button>
        )}
        <Button variant="outline" onClick={handleReset} disabled={!hasChanges || isSaving}>
          Reset
        </Button>
        <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  );
}


