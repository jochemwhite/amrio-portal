"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TypeGeneratorDialog } from "./TypeGeneratorDialog";
import { FileCode } from "lucide-react";

interface TypeGeneratorCardProps {
  schema: {
    id: string;
    name: string;
    description: string | null;
    template: boolean;
  };
}

export function TypeGeneratorCard({ schema }: TypeGeneratorCardProps) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <FileCode className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{schema.name}</CardTitle>
              {schema.description && (
                <CardDescription className="mt-1">{schema.description}</CardDescription>
              )}
            </div>
          </div>
        </div>
        {schema.template && (
          <Badge variant="secondary" className="w-fit mt-2">
            Template
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <TypeGeneratorDialog schemaId={schema.id} schemaName={schema.name} />
      </CardContent>
    </Card>
  );
}

