"use client";

import { useState } from "react";
import { ApiKeyWithStatus } from "@/types/api_keys";
import { revokeApiKey } from "@/actions/api-keys/api_key_actions";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface RevokeApiKeyDialogProps {
  apiKey: ApiKeyWithStatus;
  onClose: () => void;
}

export function RevokeApiKeyDialog({
  apiKey,
  onClose,
}: RevokeApiKeyDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleRevoke = async () => {
    setIsLoading(true);

    try {
      const result = await revokeApiKey(apiKey.id);

      if (result.success) {
        toast.success("API key revoked successfully");
        onClose();
      } else {
        toast.error(result.error || "Failed to revoke API key");
      }
    } catch (error) {
      console.error("Error revoking API key:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={true} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">
              Are you sure you want to revoke the API key <strong>{apiKey.name}</strong>?
            </span>
            <span className="block text-destructive font-semibold">
              This action cannot be undone. Any applications using this key will immediately
              lose access.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleRevoke} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Revoke API Key
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
