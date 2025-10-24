"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ApiDocumentation() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy to clipboard");
    }
  };

  const examples = [
    {
      title: "Fetch All Pages",
      language: "curl",
      code: `curl https://api.yourapp.com/v1/websites/{websiteId}/pages \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
    },
    {
      title: "Fetch Single Page",
      language: "curl",
      code: `curl https://api.yourapp.com/v1/websites/{websiteId}/pages/{pageId} \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
    },
    {
      title: "Fetch Collection Entries",
      language: "curl",
      code: `curl https://api.yourapp.com/v1/websites/{websiteId}/collections/{collectionId}/entries \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
    },
    {
      title: "Create Collection Entry",
      language: "curl",
      code: `curl -X POST https://api.yourapp.com/v1/websites/{websiteId}/collections/{collectionId}/entries \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "New Entry", "content": "Entry content"}'`,
    },
  ];

  const jsExample = `// Using fetch API
const response = await fetch('https://api.yourapp.com/v1/websites/{websiteId}/pages', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);`;

  const pythonExample = `# Using requests library
import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://api.yourapp.com/v1/websites/{websiteId}/pages',
    headers=headers
)

data = response.json()
print(data)`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Documentation</CardTitle>
        <CardDescription>
          Quick examples to get started with the CMS API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="curl" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="curl">cURL</TabsTrigger>
            <TabsTrigger value="javascript">JavaScript</TabsTrigger>
            <TabsTrigger value="python">Python</TabsTrigger>
          </TabsList>

          <TabsContent value="curl" className="space-y-4">
            {examples.map((example, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">{example.title}</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(example.code, index)}
                  >
                    {copiedIndex === index ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <div className="bg-muted p-4 rounded-lg border font-mono text-xs overflow-x-auto">
                  <pre>{example.code}</pre>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="javascript" className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Fetch API Example</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(jsExample, 100)}
                >
                  {copiedIndex === 100 ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <div className="bg-muted p-4 rounded-lg border font-mono text-xs overflow-x-auto">
                <pre>{jsExample}</pre>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="python" className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Requests Library Example</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(pythonExample, 200)}
                >
                  {copiedIndex === 200 ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <div className="bg-muted p-4 rounded-lg border font-mono text-xs overflow-x-auto">
                <pre>{pythonExample}</pre>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Additional Resources */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-semibold mb-3">Additional Resources</h4>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-between" asChild>
              <a href="/docs/api" target="_blank" rel="noopener noreferrer">
                <span>Full API Documentation</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-between" asChild>
              <a href="/docs/api/quickstart" target="_blank" rel="noopener noreferrer">
                <span>Quick Start Guide</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-between" asChild>
              <a href="/docs/api/rate-limits" target="_blank" rel="noopener noreferrer">
                <span>Rate Limits & Best Practices</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        {/* Security Note */}
        <div className="p-4 bg-muted rounded-lg border">
          <h4 className="text-sm font-semibold mb-2">Security Best Practices</h4>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Never expose your API keys in client-side code or public repositories</li>
            <li>Use environment variables to store API keys</li>
            <li>Rotate keys regularly and immediately revoke compromised keys</li>
            <li>Use test keys for development and live keys only in production</li>
            <li>Monitor API key usage and set appropriate rate limits</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

