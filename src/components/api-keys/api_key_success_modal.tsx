"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertCircle, Copy, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface ApiKeySuccessModalProps {
  apiKey: string;
  keyName: string;
  onClose: () => void;
}

export function ApiKeySuccessModal({
  apiKey,
  keyName,
  onClose,
}: ApiKeySuccessModalProps) {
  const [hasCopied, setHasCopied] = useState(false);
  const [hasConfirmed, setHasConfirmed] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setHasCopied(true);
      toast.success("API key copied to clipboard");
      setTimeout(() => setHasCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleClose = () => {
    if (hasConfirmed) {
      onClose();
    } else {
      toast.error("Please confirm that you have saved the API key");
    }
  };

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl">API Key Created Successfully!</DialogTitle>
          <DialogDescription>
            Your API key for <strong>{keyName}</strong> has been generated.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning Alert */}
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <strong>Important:</strong> This is the only time you will see this API key.
              Please copy it now and store it securely. If you lose it, you&apos;ll need to
              generate a new one.
            </AlertDescription>
          </Alert>

          {/* API Key Display */}
          <div className="space-y-2">
            <Label>Your API Key</Label>
            <div className="flex items-start gap-2 rounded-lg border bg-muted p-2 sm:p-3">
              <div className="min-w-0 flex-1 rounded-md bg-background/40 px-3 py-2 font-mono text-sm break-all">
                {apiKey}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0"
                onClick={handleCopy}
              >
                {hasCopied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Usage Example */}
          <div className="space-y-2">
            <Label>Example Usage</Label>
            <div className="bg-muted p-4 rounded-lg border font-mono text-xs overflow-x-auto">
              <pre className="whitespace-pre-wrap break-all">{`curl https://api.yourapp.com/v1/content \\
  -H "Authorization: Bearer ${apiKey.substring(0, 20)}..."`}</pre>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-start space-x-3 p-4 bg-muted rounded-lg">
            <Checkbox
              id="confirm"
              checked={hasConfirmed}
              onCheckedChange={(checked) => setHasConfirmed(checked as boolean)}
            />
            <div className="space-y-1">
              <Label
                htmlFor="confirm"
                className="font-semibold cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I have saved this API key in a secure location
              </Label>
              <p className="text-xs text-muted-foreground">
                You must confirm before closing this dialog
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleClose} disabled={!hasConfirmed}>
            I&apos;ve Saved My API Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
