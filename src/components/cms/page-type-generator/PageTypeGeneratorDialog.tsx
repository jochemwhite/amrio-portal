"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Code2, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { generateTypesForPage } from "@/actions/cms/page-type-generator-actions";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PageTypeGeneratorDialogProps {
  pageId: string;
  websiteId: string;
  pageName?: string;
}

export function PageTypeGeneratorDialog({ pageId, websiteId, pageName }: PageTypeGeneratorDialogProps) {
  const [open, setOpen] = useState(false);
  const [types, setTypes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateTypes = async () => {
    setLoading(true);
    try {
      const result = await generateTypesForPage(pageId, websiteId);
      
      if (result.success && result.data) {
        setTypes(result.data.types);
        toast.success("Types generated successfully!");
      } else {
        toast.error(result.error || "Failed to generate types");
        setOpen(false);
      }
    } catch (error) {
      console.error("Error generating types:", error);
      toast.error("An unexpected error occurred");
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(types);
      setCopied(true);
      toast.success("Types copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([types], { type: "text/typescript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pageName || "page"}-types.ts`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Types downloaded!");
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    // Generate types when dialog opens
    if (newOpen && !types) {
      handleGenerateTypes();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Code2 className="mr-2 h-4 w-4" />
          Generate Types
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            TypeScript Types - {pageName || "Page"}
          </DialogTitle>
          <DialogDescription>
            Generated flat TypeScript interface for this page.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-4 text-muted-foreground">Generating types...</p>
          </div>
        ) : types ? (
          <>
            <ScrollArea className="h-[450px] w-full rounded-md border">
              <pre className="p-4 text-xs">
                <code>{types}</code>
              </pre>
            </ScrollArea>

            <DialogFooter className="flex gap-2 justify-end">
              <Button onClick={handleCopy} variant="outline">
                <Copy className={`mr-2 h-4 w-4 ${copied ? "text-green-500" : ""}`} />
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

