"use client";

import { useState } from "react";
import { ApiKeyWithStatus } from "@/types/api_keys";
import { deleteApiKey } from "@/actions/api-keys/api_key_actions";
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

interface DeleteApiKeyDialogProps {
  apiKey: ApiKeyWithStatus;
  onClose: () => void;
  onDeleted?: (apiKeyId: string) => void;
}

export function DeleteApiKeyDialog({ apiKey, onClose, onDeleted }: DeleteApiKeyDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);

    try {
      const result = await deleteApiKey(apiKey.id);

      if (result.success) {
        toast.success("API key deleted successfully");
        onDeleted?.(apiKey.id);
        onClose();
      } else {
        toast.error(result.error || "Failed to delete API key");
      }
    } catch (error) {
      console.error("Error deleting API key:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={true} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete API Key</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">
              Are you sure you want to permanently delete the API key <strong>{apiKey.name}</strong>?
            </span>
            <span className="block text-destructive font-semibold">
              This action cannot be undone. This will permanently delete the API key and remove all associated data.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Delete API Key
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
