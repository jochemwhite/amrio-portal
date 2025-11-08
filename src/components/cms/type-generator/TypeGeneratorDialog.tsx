"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Code2, Copy, Download, Check } from "lucide-react";
import { toast } from "sonner";
import { generateTypesForSchema } from "@/actions/cms/type-generator-actions";
import { Skeleton } from "@/components/ui/skeleton";

interface TypeGeneratorDialogProps {
  schemaId: string;
  schemaName?: string;
}

export function TypeGeneratorDialog({ schemaId, schemaName }: TypeGeneratorDialogProps) {
  const [open, setOpen] = useState(false);
  const [types, setTypes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateTypes = async () => {
    setLoading(true);
    try {
      const result = await generateTypesForSchema(schemaId);
      
      if (result.success && result.data) {
        setTypes(result.data.types);
        toast.success("Types generated successfully!");
      } else {
        toast.error(result.error || "Failed to generate types");
      }
    } catch (error) {
      console.error("Error generating types:", error);
      toast.error("An unexpected error occurred");
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
    a.download = `${schemaName || "schema"}-types.ts`;
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
          <Code2 className="h-4 w-4 mr-2" />
          Generate Types
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>TypeScript Type Generator</DialogTitle>
          <DialogDescription>
            Generate TypeScript types for your schema that can be used in your client website when fetching data via the <code className="text-xs bg-muted px-1 py-0.5 rounded">get_page_content</code> RPC function.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : types ? (
            <>
              <div className="flex justify-end gap-2 mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!types}
                >
                  {copied ? (
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={!types}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>

              <div className="flex-1 overflow-auto border rounded-lg bg-muted/50">
                <pre className="p-4 text-xs">
                  <code className="language-typescript">{types}</code>
                </pre>
              </div>

              <div className="mt-4 p-4 bg-muted rounded-lg text-sm space-y-2">
                <h4 className="font-semibold">Usage Instructions:</h4>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Copy the generated types to a new file in your project (e.g., <code className="text-xs bg-background px-1 py-0.5 rounded">types/cms.ts</code>)</li>
                  <li>Import the <code className="text-xs bg-background px-1 py-0.5 rounded">PageContent</code> type in your code</li>
                  <li>Use it when fetching data via the <code className="text-xs bg-background px-1 py-0.5 rounded">get_page_content</code> RPC function</li>
                </ol>
                <div className="mt-3 p-3 bg-background rounded border">
                  <p className="text-xs font-semibold mb-2">Example:</p>
                  <pre className="text-xs text-muted-foreground">
{`import { PageContent } from './types/cms';

const response = await supabase.rpc('get_page_content', {
  page_id_param: 'your-page-id',
  website_id_param: 'your-website-id'
});

const pageData: PageContent = response.data[0];
// Now you have full TypeScript autocomplete!
console.log(pageData.sections);`}
                  </pre>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Click "Generate Types" to create TypeScript definitions
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}



