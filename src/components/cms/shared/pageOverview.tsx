"use client";

import { useEffect, useState } from "react";
import { PageStatus, Page } from "@/types/cms";
import { deletePage } from "@/actions/cms/page-actions";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/website-pages/page-table";
import { createColumns, type Page as PageTableType } from "@/components/tables/website-pages/table-columns";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Database } from "@/types/supabase";
import WebsiteStats from "./website-stats";
import PageFormModal from "@/components/modals/page-form-modal";

interface PageOverviewProps {
  pages: Database["public"]["Tables"]["cms_pages"]["Row"][];
  websiteId: string;
}

export function PageOverview({ pages, websiteId }: PageOverviewProps) {
  const [data, setData] = useState<Database["public"]["Tables"]["cms_pages"]["Row"][]>(pages);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [page, setPage] = useState<Database["public"]["Tables"]["cms_pages"]["Row"] | undefined>(undefined);

  const stats = {
    total: pages.length,
    active: pages.filter((page) => page.status === "active").length,
    draft: pages.filter((page) => page.status === "draft").length,
    archived: pages.filter((page) => page.status === "archived").length,
  };

  useEffect(() => {
    setData(pages);
  }, [pages]);

  const handleSuccess = (data: Database["public"]["Tables"]["cms_pages"]["Row"]) => {
    setData((prev) => [...prev, data]);
  };

  const handleDeletePage = async (pageId: string) => {
    try {
      const result = await deletePage({ id: pageId, websiteId });
      if (result.success) {
        setData((prev) => prev.filter((page) => page.id !== pageId));
        toast.success("Page deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete page");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  const handleStatusChange = (pageId: string, newStatus: PageStatus) => {
    // Update local state optimistically
    setData((prev) => prev.map((page) => (page.id === pageId ? { ...page, status: newStatus } : page)));

    const statusText = newStatus === "active" ? "activated" : newStatus === "archived" ? "archived" : "set to draft";
    toast.success(`Page ${statusText} successfully`);
  };

  const handleNewPage = () => {
    setIsFormOpen(true);
    setPage(undefined);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setPage(undefined);
  };

  const handleEdit = (pageId: string) => {
    setIsFormOpen(true);
    setPage(pages.find((page) => page.id === pageId));
  };

  const handleEditSchema = (pageId: string) => {
    setIsFormOpen(true);
    setPage(pages.find((page) => page.id === pageId));
  };

  const columns = createColumns(handleEdit, handleEditSchema, handleDeletePage, handleStatusChange);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pages</h1>
          <p className="text-muted-foreground">Manage your content pages and their schemas</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleNewPage}>
            <Plus className="mr-2 h-4 w-4" />
            New Page
          </Button>
        </div>
      </div>

      <PageFormModal isFormOpen={isFormOpen} handleFormClose={handleFormClose} page={page} websiteId={websiteId} onSuccess={handleSuccess} />

      {/* Stats Cards */}
      <WebsiteStats total={stats.total} active={stats.active} draft={stats.draft} archived={stats.archived} />

      {/* Pages Table */}
      <DataTable columns={columns} data={data} />
    </div>
  );
}