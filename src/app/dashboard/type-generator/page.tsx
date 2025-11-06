import { getSchemasForTenant } from "@/actions/cms/type-generator-actions";
import { TypeGeneratorCard } from "@/components/cms/type-generator/TypeGeneratorCard";
import { Code2 } from "lucide-react";

export default async function TypeGeneratorPage() {
  const result = await getSchemasForTenant();

  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Code2 className="h-8 w-8" />
          <h1 className="text-3xl font-bold tracking-tight">TypeScript Type Generator</h1>
        </div>
        <p className="text-muted-foreground">
          Generate TypeScript types for your schemas to use in your client websites. 
          These types provide full autocomplete and type safety when fetching content via the <code className="text-sm bg-muted px-1 py-0.5 rounded">get_page_content</code> RPC function.
        </p>
      </div>

      {result.success ? (
        result.data && result.data.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {result.data.map((schema) => (
              <TypeGeneratorCard key={schema.id} schema={schema} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg">
            <Code2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No Schemas Found</h2>
            <p className="text-muted-foreground">
              Create a schema first to generate TypeScript types.
            </p>
          </div>
        )
      ) : (
        <div className="text-center py-12 border rounded-lg border-destructive bg-destructive/10">
          <p className="text-destructive">{result.error || "Failed to load schemas"}</p>
        </div>
      )}
    </div>
  );
}

