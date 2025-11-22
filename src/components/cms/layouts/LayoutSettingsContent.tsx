"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/supabaseClient";
import { getActiveTenantId } from "@/server/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLayoutOverrideSelector } from "@/components/cms/pages/PageLayoutOverrideSelector";
import { getPageLayoutOverride } from "@/actions/cms/layout-actions";
import { PageLayoutOverride } from "@/types/cms";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface Page {
  id: string;
  name: string;
  slug: string;
  website_id: string;
}

export function LayoutSettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPageId = searchParams.get("page");

  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [override, setOverride] = useState<PageLayoutOverride | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOverride, setIsLoadingOverride] = useState(false);

  // Load pages on mount
  useEffect(() => {
    loadPages();
  }, []);

  // Load override when page selection changes
  useEffect(() => {
    if (selectedPageId) {
      const page = pages.find((p) => p.id === selectedPageId);
      if (page) {
        setSelectedPage(page);
        loadOverride(selectedPageId);
      }
    } else {
      setSelectedPage(null);
      setOverride(null);
    }
  }, [selectedPageId, pages]);

  const loadPages = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      
      // Get all pages for the active tenant
      const { data: pagesData, error } = await supabase
        .from("cms_pages")
        .select("id, name, slug, website_id")
        .order("name");

      if (error) {
        console.error("Error loading pages:", error);
      } else {
        setPages(pagesData || []);
      }
    } catch (error) {
      console.error("Error loading pages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOverride = async (pageId: string) => {
    setIsLoadingOverride(true);
    try {
      const result = await getPageLayoutOverride(pageId);
      setOverride(result.success ? result.data : null);
    } catch (error) {
      console.error("Error loading override:", error);
    } finally {
      setIsLoadingOverride(false);
    }
  };

  const handlePageSelect = (pageId: string) => {
    router.push(`/dashboard/layout-settings?page=${pageId}`);
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Page</CardTitle>
          <CardDescription>
            Choose a page to configure its header and footer layout overrides
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="page-select">Page</Label>
            <Select value={selectedPageId || ""} onValueChange={handlePageSelect}>
              <SelectTrigger id="page-select" className="w-full">
                <SelectValue placeholder="Select a page..." />
              </SelectTrigger>
              <SelectContent>
                {pages.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">No pages found</div>
                ) : (
                  pages.map((page) => (
                    <SelectItem key={page.id} value={page.id}>
                      {page.name} ({page.slug})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedPage && (
        <>
          {isLoadingOverride ? (
            <Card>
              <CardContent className="py-12 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : (
            <PageLayoutOverrideSelector
              pageId={selectedPage.id}
              websiteId={selectedPage.website_id}
              initialOverride={override}
            />
          )}
        </>
      )}

      {!selectedPage && !isLoading && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Select a page above to configure its layout overrides
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

