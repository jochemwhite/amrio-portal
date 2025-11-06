"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSchemaBuilderStore } from "@/stores/useSchemaBuilderStore";
import { Settings } from "lucide-react";
import { TypeGeneratorDialog } from "../type-generator/TypeGeneratorDialog";

export function SchemaInfo() {
  const { schema, openSchemaSettings } = useSchemaBuilderStore();

  if (!schema) return null;

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{schema.name}</h1>
            {schema.template && (
              <Badge variant="secondary">Template</Badge>
            )}
          </div>
          {schema.description && (
            <p className="text-muted-foreground">{schema.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <TypeGeneratorDialog schemaId={schema.id} schemaName={schema.name} />
          <Button variant="outline" size="sm" onClick={openSchemaSettings}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>
    </Card>
  );
}

