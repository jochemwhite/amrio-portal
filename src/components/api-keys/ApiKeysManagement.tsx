"use client";

import { useState, useMemo } from "react";
import { ApiKeyWithStatus } from "@/types/api-keys";
import { Website } from "@/types/cms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { ApiKeysTable } from "./ApiKeysTable";
import { CreateApiKeyDialog } from "./CreateApiKeyDialog";
import { ApiKeySuccessModal } from "./ApiKeySuccessModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ApiKeysManagementProps {
  initialApiKeys: ApiKeyWithStatus[];
  availableWebsites: Website[];
}

export function ApiKeysManagement({
  initialApiKeys,
  availableWebsites,
}: ApiKeysManagementProps) {
  const [apiKeys, setApiKeys] = useState<ApiKeyWithStatus[]>(initialApiKeys);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "revoked" | "expired">("all");
  const [websiteFilter, setWebsiteFilter] = useState<string>("all-websites");
  
  // Success modal state
  const [generatedKey, setGeneratedKey] = useState<{
    key: string;
    name: string;
  } | null>(null);

  // Filter API keys based on search and filters
  const filteredApiKeys = useMemo(() => {
    return apiKeys.filter((key) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        key.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        key.maskedKey.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === "all" || key.status === statusFilter;

      // Website filter
      const matchesWebsite =
        websiteFilter === "all-websites" ||
        (websiteFilter === "no-website" && !key.website_id) ||
        key.website_id === websiteFilter;

      return matchesSearch && matchesStatus && matchesWebsite;
    });
  }, [apiKeys, searchQuery, statusFilter, websiteFilter]);

  const handleApiKeyCreated = (newKey: { key: string; name: string }) => {
    setGeneratedKey(newKey);
    setIsCreateDialogOpen(false);
    // The page will be revalidated, so we don't need to manually update the list

  };


  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1 w-full">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search API keys..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="revoked">Revoked</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>

          {/* Website Filter */}
          <Select value={websiteFilter} onValueChange={setWebsiteFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Websites" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-websites">All Websites</SelectItem>
              <SelectItem value="no-website">No Website</SelectItem>
              {availableWebsites.map((website) => (
                <SelectItem key={website.id} value={website.id}>
                  {website.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Create Button */}
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create API Key
        </Button>
      </div>

      {/* API Keys Table */}
      <ApiKeysTable
        apiKeys={filteredApiKeys}
        availableWebsites={availableWebsites}
      />



      {/* Create Dialog */}
      <CreateApiKeyDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={handleApiKeyCreated}
        availableWebsites={availableWebsites}
      />

      {/* Success Modal */}
      {generatedKey && (
        <ApiKeySuccessModal
          apiKey={generatedKey.key}
          keyName={generatedKey.name}
          onClose={() => setGeneratedKey(null)}
        />
      )}
    </div>
  );
}

