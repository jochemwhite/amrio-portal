"use client";

import { useState } from "react";
import { ApiKeyWithStatus } from "@/types/api-keys";
import { rotateApiKey } from "@/actions/api-keys/api-key-actions";
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
import { ApiKeySuccessModal } from "./ApiKeySuccessModal";

interface RotateApiKeyDialogProps {
  apiKey: ApiKeyWithStatus;
  onClose: () => void;
}

export function RotateApiKeyDialog({ apiKey, onClose }: RotateApiKeyDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<{
    key: string;
    name: string;
  } | null>(null);

  const handleRotate = async () => {
    setIsLoading(true);

    try {
      const result = await rotateApiKey(apiKey.id);

      if (result.success && result.data) {
        toast.success("API key rotated successfully");
        setGeneratedKey({
          key: result.data.key,
          name: result.data.name,
        });
        onClose();
      } else {
        toast.error(result.error || "Failed to rotate API key");
      }
    } catch (error) {
      console.error("Error rotating API key:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (generatedKey) {
    return (
      <ApiKeySuccessModal
        apiKey={generatedKey.key}
        keyName={generatedKey.name}
        onClose={() => {
          setGeneratedKey(null);
        }}
      />
    );
  }

  return (
    <AlertDialog open={true} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Rotate API Key</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              This will create a new API key with the same settings and automatically revoke the old key <strong>{apiKey.name}</strong>.
            </p>
            <p className="text-orange-600 font-semibold">
              The old key will stop working immediately. Make sure you&apos;re ready to update your applications with the new key.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleRotate} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Rotate API Key
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
