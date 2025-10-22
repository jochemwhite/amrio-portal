"use client";

import { useState } from "react";
import { deleteWebsite } from "@/actions/cms/website-actions";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/websites/website-table";
import { createColumns } from "@/components/tables/websites/table-columns";
import { Plus, Globe } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import WebsiteFormModal from "@/components/modals/WebsiteFormModal";
import { Database } from "@/types/supabase";

type Website = Database["public"]["Tables"]["cms_websites"]["Row"];

interface WebsiteOverviewProps {
  websites: Website[];
}

export function WebsiteOverview({ websites }: WebsiteOverviewProps) {
  const router = useRouter();
  const [data, setData] = useState<Website[]>(websites);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [website, setWebsite] = useState<Website | undefined>(undefined);

  const stats = {
    total: websites.length,
    active: websites.filter((website) => website.status === "active").length,
    inactive: websites.filter((website) => website.status === "inactive").length,
    maintenance: websites.filter((website) => website.status === "maintenance").length,
  };

  const handleSuccess = (data: Website) => {
    setData((prev) => {
      const index = prev.findIndex((w) => w.id === data.id);
      if (index >= 0) {
        // Update existing
        const newData = [...prev];
        newData[index] = data;
        return newData;
      } else {
        // Add new
        return [data, ...prev];
      }
    });
  };

  const handleDeleteWebsite = async (websiteId: string) => {
    try {
      const result = await deleteWebsite(websiteId);
      if (result.success) {
        setData((prev) => prev.filter((website) => website.id !== websiteId));
        toast.success("Website deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete website");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  const handleNewWebsite = () => {
    setIsFormOpen(true);
    setWebsite(undefined);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setWebsite(undefined);
  };

  const handleEdit = (websiteId: string) => {
    setIsFormOpen(true);
    setWebsite(websites.find((website) => website.id === websiteId));
  };

  const handleRowClick = (websiteId: string) => {
    router.push(`/dashboard/websites/${websiteId}/pages`);
  };

  const columns = createColumns(handleEdit, handleDeleteWebsite, handleRowClick);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Websites</h1>
          <p className="text-muted-foreground">Manage your websites and their content</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleNewWebsite}>
            <Plus className="mr-2 h-4 w-4" />
            New Website
          </Button>
        </div>
      </div>

      <WebsiteFormModal isFormOpen={isFormOpen} handleFormClose={handleFormClose} website={website} onSuccess={handleSuccess} />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Total Websites</p>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold mt-2">{stats.total}</p>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Active</p>
            <div className="h-2 w-2 rounded-full bg-green-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{stats.active}</p>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Inactive</p>
            <div className="h-2 w-2 rounded-full bg-gray-400" />
          </div>
          <p className="text-2xl font-bold mt-2">{stats.inactive}</p>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Maintenance</p>
            <div className="h-2 w-2 rounded-full bg-orange-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{stats.maintenance}</p>
        </div>
      </div>

      {/* Websites Table */}
      <DataTable columns={columns} data={data} />
    </div>
  );
}

