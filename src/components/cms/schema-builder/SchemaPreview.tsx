"use client";

import { useMemo } from 'react';
import { useCMSStore } from '@/stores/useCMSStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Copy, Eye } from 'lucide-react';
import { toast } from 'sonner';

export function SchemaPreview() {
  const { sections } = useCMSStore();

  const schema = useMemo(() => {
    return {
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      sections: sections.map(section => ({
        id: section.id,
        name: section.name,
        description: section.description,
        fields: section.fields.map(field => ({
          id: field.id,
          name: field.name,
          type: field.type,
          required: field.required || false,
          defaultValue: field.defaultValue,
          validation: field.validation,
          order: field.order || 0,
        })).sort((a, b) => a.order - b.order),
      })),
    };
  }, [sections]);

  const jsonString = useMemo(() => {
    return JSON.stringify(schema, null, 2);
  }, [schema]);

  const handleExportJSON = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cms-schema-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Schema Exported", {
      description: "The schema has been downloaded as a JSON file.",
    });
  };

  const handleCopyJSON = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      toast.success("Schema copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy schema to clipboard");
    }
  };

  const getSchemaStats = () => {
    const totalFields = sections.reduce((acc, section) => acc + section.fields.length, 0);
    const fieldTypes = sections.flatMap(section => section.fields).reduce((acc, field) => {
      acc[field.type] = (acc[field.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      sections: sections.length,
      totalFields,
      fieldTypes,
    };
  };

  const stats = getSchemaStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Schema Preview</h2>
          <p className="text-muted-foreground">
            Live preview of your content model schema
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleCopyJSON}>
            <Copy className="mr-2 h-4 w-4" />
            Copy JSON
          </Button>
          <Button onClick={handleExportJSON}>
            <Download className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schema Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="mr-2 h-5 w-5" />
              Schema Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sections:</span>
              <Badge variant="secondary">{stats.sections}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Fields:</span>
              <Badge variant="secondary">{stats.totalFields}</Badge>
            </div>
            
            {Object.keys(stats.fieldTypes).length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Field Types:</h4>
                <div className="space-y-2">
                  {Object.entries(stats.fieldTypes).map(([type, count]) => (
                    <div key={type} className="flex justify-between text-sm">
                      <span className="capitalize">{type}:</span>
                      <Badge variant="outline" className="text-xs">
                        {count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* JSON Preview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>JSON Schema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto max-h-96 overflow-y-auto">
                <code className="language-json">{jsonString}</code>
              </pre>
              {sections.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <p className="text-muted-foreground">
                      No sections created yet
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create sections to see the schema preview
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section Details */}
      {sections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Section Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {sections.map((section) => (
                <div key={section.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{section.name}</h3>
                      {section.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {section.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline">
                      {section.fields.length} field{section.fields.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  {section.fields.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {section.fields
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map((field) => (
                          <div
                            key={field.id}
                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                          >
                            <div>
                              <div className="font-medium text-sm">
                                {field.name}
                                {field.required && (
                                  <span className="text-red-500 ml-1">*</span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {field.type}
                              </div>
                            </div>
                            {field.defaultValue && (
                              <Badge variant="secondary" className="text-xs">
                                Default: {field.defaultValue}
                              </Badge>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 