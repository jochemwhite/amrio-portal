"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { ApiKeyWithStatus } from "@/types/api-keys";

type SimpleWebsite = {
  id: string;
  name: string;
  domain: string;
};
import { format } from "date-fns";
import { Ban, Copy, MoreHorizontal, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { DeleteApiKeyDialog } from "./DeleteApiKeyDialog";
import { RevokeApiKeyDialog } from "./RevokeApiKeyDialog";
import { RotateApiKeyDialog } from "./RotateApiKeyDialog";

interface ApiKeysTableProps {
  apiKeys: ApiKeyWithStatus[];
  availableWebsites: SimpleWebsite[];
}

export function ApiKeysTable({
  apiKeys,
  availableWebsites,
}: ApiKeysTableProps) {
  const [revokeDialogKey, setRevokeDialogKey] = useState<ApiKeyWithStatus | null>(null);
  const [deleteDialogKey, setDeleteDialogKey] = useState<ApiKeyWithStatus | null>(null);
  const [rotateDialogKey, setRotateDialogKey] = useState<ApiKeyWithStatus | null>(null);
  const copyToClipboard = useCopyToClipboard();

  const handleCopyKeyId = (keyId: string) => {
    copyToClipboard(keyId, "Key ID");
  };

  const getStatusBadge = (status: "active" | "revoked" | "expired") => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case "revoked":
        return <Badge variant="destructive">Revoked</Badge>;
      case "expired":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Expired</Badge>;
    }
  };

  const getEnvironmentBadge = (environment: "live" | "test") => {
    return environment === "live" ? (
      <Badge className="bg-blue-500 hover:bg-blue-600">Live</Badge>
    ) : (
      <Badge variant="secondary">Test</Badge>
    );
  };

  const getScopesBadges = (scopes: any) => {
    if (!scopes || !Array.isArray(scopes)) return null;
    
    return (
      <div className="flex gap-1">
        {scopes.includes("read") && (
          <Badge variant="outline" className="text-xs">
            Read
          </Badge>
        )}
        {scopes.includes("write") && (
          <Badge variant="outline" className="text-xs">
            Write
          </Badge>
        )}
      </div>
    );
  };

  const getWebsiteName = (websiteId: string | null) => {
    if (!websiteId) return <span className="text-muted-foreground">All websites</span>;
    const website = availableWebsites.find((w) => w.id === websiteId);
    return website ? website.name : <span className="text-muted-foreground">Unknown</span>;
  };

  if (apiKeys.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <Copy className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">No API keys found</h3>
            <p className="text-muted-foreground mt-1">
              Create your first API key to start accessing the CMS API.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Environment</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>Scopes</TableHead>
              <TableHead>Rate Limit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apiKeys.map((apiKey) => (
              <TableRow key={apiKey.id}>
                <TableCell className="font-medium">{apiKey.name}</TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {apiKey.maskedKey}
                  </code>
                </TableCell>
                <TableCell>{getEnvironmentBadge(apiKey.environment)}</TableCell>
                <TableCell>{getWebsiteName(apiKey.website_id)}</TableCell>
                <TableCell>{getScopesBadges(apiKey.scopes)}</TableCell>
                <TableCell>{apiKey.rate_limit}/hour</TableCell>
                <TableCell>{getStatusBadge(apiKey.status)}</TableCell>
                <TableCell>
                  {apiKey.last_used_at ? (
                    <span className="text-sm">
                      {format(new Date(apiKey.last_used_at), "MMM d, yyyy")}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">Never</span>
                  )}
                </TableCell>
                <TableCell>
                  {apiKey.created_at && (
                    <span className="text-sm">
                      {format(new Date(apiKey.created_at), "MMM d, yyyy")}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleCopyKeyId(apiKey.id)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Key ID
                      </DropdownMenuItem>
                      {apiKey.status === "active" && (
                        <>
                          <DropdownMenuItem onClick={() => setRotateDialogKey(apiKey)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Rotate Key
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setRevokeDialogKey(apiKey)}
                            className="text-orange-600"
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Revoke Key
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem
                        onClick={() => setDeleteDialogKey(apiKey)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Key
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Action Dialogs */}
      {revokeDialogKey && (
        <RevokeApiKeyDialog
          apiKey={revokeDialogKey}
          onClose={() => setRevokeDialogKey(null)}
        />
      )}

      {deleteDialogKey && (
        <DeleteApiKeyDialog
          apiKey={deleteDialogKey}
          onClose={() => setDeleteDialogKey(null)}
        />
      )}

      {rotateDialogKey && (
        <RotateApiKeyDialog
          apiKey={rotateDialogKey}
          onClose={() => setRotateDialogKey(null)}
        />
      )}
    </>
  );
}

