"use client";

import { useState, useMemo, useEffect } from "react";
import { ApiKeyWithStatus } from "@/types/api_keys";
import { getApiKeyById } from "@/actions/api-keys/api_key_actions";

type SimpleWebsite = {
  id: string;
  name: string;
  domain: string;
};
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { ApiKeysTable } from "./api_keys_table";
import { CreateApiKeyDialog } from "./create_api_key_dialog";
import { ApiKeySuccessModal } from "./api_key_success_modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ApiKeysManagementProps {
  initialApiKeys: ApiKeyWithStatus[];
  availableWebsites: SimpleWebsite[];
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

  useEffect(() => {
    setApiKeys(initialApiKeys);
  }, [initialApiKeys]);

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

  const handleApiKeyCreated = async (newKey: { key: string; name: string; keyId: string }) => {
    setGeneratedKey({ key: newKey.key, name: newKey.name });
    setIsCreateDialogOpen(false);
    const createdKeyResult = await getApiKeyById(newKey.keyId);
    if (createdKeyResult.success && createdKeyResult.data) {
      const createdKey = createdKeyResult.data;
      setApiKeys((prev) => [createdKey, ...prev.filter((key) => key.id !== createdKey.id)]);
    }
  };

  const handleApiKeyDeleted = (apiKeyId: string) => {
    setApiKeys((prev) => prev.filter((key) => key.id !== apiKeyId));
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
        onDeleteSuccess={handleApiKeyDeleted}
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
