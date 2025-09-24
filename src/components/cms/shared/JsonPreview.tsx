"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { usePageBuilderStore } from "@/stores/usePageBuilderStore";
import { Copy, Download, Eye, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/supabaseClient";
import { RPCPageResponse } from "@/types/cms";

interface JsonPreviewProps {
  trigger?: React.ReactNode;
}

export function JsonPreview({ trigger }: JsonPreviewProps) {
  const { page, websiteId } = usePageBuilderStore();
  const [isOpen, setIsOpen] = useState(false);
  const [rpcPageData, setRpcPageData] = useState<RPCPageResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch page data using RPC function when sheet opens
  const fetchPageData = async () => {
    if (!page?.id || !websiteId) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: pageData, error: pageError } = await supabase.rpc("get_page" as any, {
        page_id_param: page.id,
        website_id_param: websiteId,
      });

      if (pageError) {
        throw new Error(pageError.message);
      }

      if (!pageData || !Array.isArray(pageData) || pageData.length === 0) {
        throw new Error("Page not found");
      }

      // Extract the first page from the response array
      const rpcPage: RPCPageResponse = pageData[0] as RPCPageResponse;
      setRpcPageData(rpcPage);
    } catch (err) {
      console.error("Error fetching page data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch page data");
      toast.error("Failed to fetch page data");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when sheet opens
  useEffect(() => {
    if (isOpen && page?.id && websiteId) {
      fetchPageData();
    }
  }, [isOpen, page?.id, websiteId]);

  // Helper function to recursively map fields
  const mapFieldsRecursively = (fields: any[]): any[] => {
    return fields.map((field) => {
      const baseField = {
        id: field.id,
        name: field.name,
        type: field.type,
        required: field.required,
        default_value: field.default_value,
        validation: field.validation,
        order: field.order,
        created_at: field.created_at,
        updated_at: field.updated_at,
        parent_field_id: field.parent_field_id,
      };

      // Add nested fields if this field has them
      if (field.fields && Array.isArray(field.fields)) {
        return {
          ...baseField,
          fields: mapFieldsRecursively(field.fields),
        };
      }

      return baseField;
    });
  };

  // Helper function to count all fields recursively
  const countFieldsRecursively = (fields: any[]): number => {
    let count = fields.length;
    fields.forEach((field) => {
      if (field.fields && Array.isArray(field.fields)) {
        count += countFieldsRecursively(field.fields);
      }
    });
    return count;
  };

  // Transform the RPC page data into API output format
  const generateApiOutput = () => {
    if (!rpcPageData) return null;

    const sections = rpcPageData.sections || [];
    
    return {
      page: {
        id: rpcPageData.id,
        name: rpcPageData.name,
        slug: rpcPageData.slug,
        description: rpcPageData.description,
        status: rpcPageData.status,
        website_id: rpcPageData.website_id,
        created_at: rpcPageData.created_at,
        updated_at: rpcPageData.updated_at,
      },
      sections: sections.map((section) => ({
        id: section.id,
        name: section.name,
        description: section.description,
        order: section.order,
        page_id: section.page_id,
        created_at: section.created_at,
        updated_at: section.updated_at,
        fields: mapFieldsRecursively(section.fields || []),
      })),
      metadata: {
        total_sections: sections.length,
        total_fields: sections.reduce(
          (acc, section) => acc + countFieldsRecursively(section.fields || []),
          0
        ),
        generated_at: new Date().toISOString(),
      },
    };
  };

  const apiOutput = generateApiOutput();
  const jsonString = apiOutput ? JSON.stringify(apiOutput, null, 2) : "";

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      toast.success("JSON copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleDownload = () => {
    if (!rpcPageData || !jsonString) return;
    
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${rpcPageData.slug}-schema.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("JSON downloaded successfully");
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Eye className="mr-2 h-4 w-4" />
      Preview
    </Button>
  );

  if (!page) {
    return null;
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || defaultTrigger}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>API Output Preview</SheetTitle>
          <SheetDescription>
            Preview how your page schema will look when accessed via API
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex flex-col flex-1 space-y-4 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading page data...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-destructive mb-2">Error loading page data</p>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchPageData} size="sm">
                Retry
              </Button>
            </div>
          ) : rpcPageData ? (
            <>
              {/* Page Info */}
              <div className="space-y-2 flex-shrink-0">
                <h3 className="text-sm font-medium text-muted-foreground">Page Information</h3>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{rpcPageData.name}</span>
                  <Badge variant={rpcPageData.status === "active" ? "default" : "secondary"}>
                    {rpcPageData.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  <span>Slug: </span>
                  <code className="bg-muted px-1 rounded">/{rpcPageData.slug}</code>
                </div>
                <div className="text-sm text-muted-foreground">
                  <span>Website ID: </span>
                  <span>{rpcPageData.website_id}</span>
                </div>
              </div>

              <Separator className="flex-shrink-0" />

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4 text-center flex-shrink-0">
                <div>
                  <div className="text-2xl font-bold">{rpcPageData.sections?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Sections</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {rpcPageData.sections?.reduce((acc, section) => acc + countFieldsRecursively(section.fields || []), 0) || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Fields</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {rpcPageData.sections?.reduce(
                      (acc, section) =>
                        acc + (section.fields?.filter((f) => f.type === "section").length || 0),
                      0
                    ) || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Nested Sections</div>
                </div>
              </div>

              <Separator className="flex-shrink-0" />

              {/* Actions */}
              <div className="flex gap-2 flex-shrink-0">
                <Button onClick={handleCopyToClipboard} variant="outline" size="sm" disabled={!apiOutput}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy JSON
                </Button>
                <Button onClick={handleDownload} variant="outline" size="sm" disabled={!apiOutput}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>

              {/* JSON Preview */}
              <div className="flex flex-col flex-1 min-h-0">
                <h3 className="text-sm font-medium text-muted-foreground mb-2 flex-shrink-0">JSON Output</h3>
                <ScrollArea className="flex-1 border rounded-md bg-muted">
                  <pre className="p-4 text-xs whitespace-pre min-w-max">
                    <code className="text-foreground">{jsonString}</code>
                  </pre>
                  <ScrollBar orientation="vertical" className="bg-muted-foreground/20" />
                  <ScrollBar orientation="horizontal" className="bg-muted-foreground/20" />
                </ScrollArea>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">No page data available</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
