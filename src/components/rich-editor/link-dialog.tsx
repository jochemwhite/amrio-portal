"use client";

import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { AlertCircle } from "lucide-react";

interface LinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialUrl?: string;
  onSubmit: (url: string | null) => void;
}

const LinkDialog = ({ open, onOpenChange, initialUrl = "", onSubmit }: LinkDialogProps) => {
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setUrl(initialUrl);
      setError(null);
    }
  }, [open, initialUrl]);

  const validateUrl = useCallback((urlString: string): boolean => {
    if (!urlString.trim()) {
      return true; // Empty URL is valid (will remove the link)
    }

    try {
      // Add protocol if missing
      const urlWithProtocol = urlString.includes("://") ? urlString : `https://${urlString}`;
      const parsedUrl = new URL(urlWithProtocol);

      // Check for valid protocols
      const allowedProtocols = ["http:", "https:", "mailto:", "tel:"];
      if (!allowedProtocols.includes(parsedUrl.protocol)) {
        setError(`Protocol "${parsedUrl.protocol}" is not allowed. Use http, https, mailto, or tel.`);
        return false;
      }

      // Check for disallowed domains (example list)
      const disallowedDomains = ["example-phishing.com", "malicious-site.net"];
      if (disallowedDomains.includes(parsedUrl.hostname)) {
        setError("This domain is not allowed.");
        return false;
      }

      setError(null);
      return true;
    } catch {
      setError("Please enter a valid URL (e.g., https://example.com or example.com)");
      return false;
    }
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Empty URL means remove the link
      if (url.trim() === "") {
        onSubmit("");
        onOpenChange(false);
        return;
      }

      // Validate URL
      if (validateUrl(url)) {
        // Add protocol if missing
        const finalUrl = url.includes("://") ? url : `https://${url}`;
        onSubmit(finalUrl);
        onOpenChange(false);
      }
    },
    [url, validateUrl, onSubmit, onOpenChange]
  );

  const handleCancel = useCallback(() => {
    onSubmit(null);
    onOpenChange(false);
  }, [onSubmit, onOpenChange]);

  const handleRemove = useCallback(() => {
    onSubmit("");
    onOpenChange(false);
  }, [onSubmit, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{initialUrl ? "Edit Link" : "Insert Link"}</DialogTitle>
            <DialogDescription>
              Enter a URL to create a hyperlink. You can enter a full URL or just the domain name.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="text"
                placeholder="https://example.com or example.com"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError(null);
                }}
                autoFocus
                className={error ? "border-red-500" : ""}
              />
              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="ml-2">{error}</AlertDescription>
                </Alert>
              )}
              <p className="text-sm text-muted-foreground">
                Supported: http://, https://, mailto:, tel:
              </p>
            </div>
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            <div>
              {initialUrl && (
                <Button type="button" variant="destructive" onClick={handleRemove}>
                  Remove Link
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit">
                {initialUrl ? "Update" : "Insert"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LinkDialog;

