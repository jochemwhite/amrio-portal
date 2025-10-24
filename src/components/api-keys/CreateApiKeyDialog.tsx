"use client";

import { useState } from "react";
type SimpleWebsite = {
  id: string;
  name: string;
  domain: string;
};
import { CreateApiKeyFormData } from "@/types/api-keys";
import { createApiKey } from "@/actions/api-keys/api-key-actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface CreateApiKeyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (key: { key: string; name: string }) => void;
  availableWebsites: SimpleWebsite[];
}

export function CreateApiKeyDialog({
  isOpen,
  onClose,
  onSuccess,
  availableWebsites,
}: CreateApiKeyDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [environment, setEnvironment] = useState<"live" | "test">("test");
  const [websiteId, setWebsiteId] = useState<string>("");
  const [readScope, setReadScope] = useState(true);
  const [writeScope, setWriteScope] = useState(false);
  const [rateLimit, setRateLimit] = useState("1000");
  const [expiresIn, setExpiresIn] = useState<string>("never");
  const [description, setDescription] = useState("");
  const [allowedOrigins, setAllowedOrigins] = useState("");
  const [allowedIps, setAllowedIps] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Please enter a key name");
      return;
    }

    if (!readScope && !writeScope) {
      toast.error("Please select at least one scope");
      return;
    }

    setIsLoading(true);

    try {
      const scopes: ("read" | "write")[] = [];
      if (readScope) scopes.push("read");
      if (writeScope) scopes.push("write");

      const formData: CreateApiKeyFormData = {
        name: name.trim(),
        environment,
        websiteId: websiteId || undefined,
        scopes,
        rateLimit: parseInt(rateLimit) || 1000,
        expiresIn: expiresIn as any,
        metadata: {
          description: description.trim() || undefined,
          allowedOrigins: allowedOrigins
            ? allowedOrigins.split(",").map((o) => o.trim()).filter(Boolean)
            : undefined,
          allowedIps: allowedIps
            ? allowedIps.split(",").map((i) => i.trim()).filter(Boolean)
            : undefined,
        },
      };

      const result = await createApiKey(formData);

      if (result.success && result.data) {
        toast.success("API key created successfully");
        onSuccess({
          key: result.data.key,
          name: result.data.name,
        });
        handleClose();
      } else {
        toast.error(result.error || "Failed to create API key");
      }
    } catch (error) {
      console.error("Error creating API key:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      // Reset form
      setName("");
      setEnvironment("test");
      setWebsiteId("");
      setReadScope(true);
      setWriteScope(false);
      setRateLimit("1000");
      setExpiresIn("never");
      setDescription("");
      setAllowedOrigins("");
      setAllowedIps("");
      setShowAdvanced(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New API Key</DialogTitle>
          <DialogDescription>
            Generate a new API key to access your CMS data programmatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Key Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Key Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Production Website, Staging API"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Environment */}
          <div className="space-y-2">
            <Label>
              Environment <span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={environment}
              onValueChange={(value: "live" | "test") => setEnvironment(value)}
              disabled={isLoading}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="test" id="test" />
                <Label htmlFor="test" className="font-normal cursor-pointer">
                  Test - For development and testing
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="live" id="live" />
                <Label htmlFor="live" className="font-normal cursor-pointer">
                  Live - For production use
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website">Website (Optional)</Label>
            <Select value={websiteId || "all-websites"} onValueChange={(value) => setWebsiteId(value === "all-websites" ? "" : value)} disabled={isLoading}>
              <SelectTrigger id="website">
                <SelectValue placeholder="All websites" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-websites">All websites</SelectItem>
                {availableWebsites.map((website) => (
                  <SelectItem key={website.id} value={website.id}>
                    {website.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Scope this key to a specific website or leave empty for all websites
            </p>
          </div>

          {/* Scopes */}
          <div className="space-y-2">
            <Label>
              Scopes <span className="text-destructive">*</span>
            </Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="read"
                  checked={readScope}
                  onCheckedChange={(checked) => setReadScope(checked as boolean)}
                  disabled={isLoading}
                />
                <Label htmlFor="read" className="font-normal cursor-pointer">
                  Read access - Retrieve CMS content
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="write"
                  checked={writeScope}
                  onCheckedChange={(checked) => setWriteScope(checked as boolean)}
                  disabled={isLoading}
                />
                <Label htmlFor="write" className="font-normal cursor-pointer">
                  Write access - Create and update content
                </Label>
              </div>
            </div>
          </div>

          {/* Rate Limit */}
          <div className="space-y-2">
            <Label htmlFor="rateLimit">Rate Limit (requests per hour)</Label>
            <Input
              id="rateLimit"
              type="number"
              min="1"
              value={rateLimit}
              onChange={(e) => setRateLimit(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Expires In */}
          <div className="space-y-2">
            <Label htmlFor="expires">Expires In</Label>
            <Select value={expiresIn} onValueChange={setExpiresIn} disabled={isLoading}>
              <SelectTrigger id="expires">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never</SelectItem>
                <SelectItem value="30d">30 days</SelectItem>
                <SelectItem value="90d">90 days</SelectItem>
                <SelectItem value="1y">1 year</SelectItem>
                <SelectItem value="2y">2 years</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Options */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium">
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
              />
              Advanced Options
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description / Notes</Label>
                <Textarea
                  id="description"
                  placeholder="Optional notes about this API key"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isLoading}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="allowedOrigins">Allowed Origins (comma-separated)</Label>
                <Textarea
                  id="allowedOrigins"
                  placeholder="https://example.com, https://app.example.com"
                  value={allowedOrigins}
                  onChange={(e) => setAllowedOrigins(e.target.value)}
                  disabled={isLoading}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="allowedIps">Allowed IP Addresses (comma-separated)</Label>
                <Textarea
                  id="allowedIps"
                  placeholder="192.168.1.1, 10.0.0.1"
                  value={allowedIps}
                  onChange={(e) => setAllowedIps(e.target.value)}
                  disabled={isLoading}
                  rows={2}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create API Key
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

