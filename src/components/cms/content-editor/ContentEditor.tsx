"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useContentEditorStore } from "@/stores/useContentEditorStore";
import { RPCPageResponse } from "@/types/cms";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ContentEditorHeader from "./ContentEditorHeader";
import RenderComponent from "./RenderComponent";
import NoSectionsFound from "./NoSectionsFound";

interface ContentEditorProps {
  pageId: string;
  existingContent: RPCPageResponse;
  originalFields: { id: string; type: string; content: any; collection_id?: string | null }[];
}

export function ContentEditor({ pageId, existingContent, originalFields }: ContentEditorProps) {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const { isLoading, initializeContent, getFieldValue } = useContentEditorStore();

  // The RPC response already has the nested structure built-in
  const processedSections = useMemo(() => {
    return existingContent.sections || [];
  }, [existingContent.sections]);

  // Helper function to recursively initialize field values
  const initializeFieldValues = (fields: any[], content: Record<string, any>) => {
    fields.forEach((field) => {
      if (field.type === "section" && field.fields) {
        // Initialize nested section field with an object containing its nested fields
        const nestedValues: Record<string, any> = {};
        initializeFieldValues(field.fields, nestedValues);
        content[field.id] = nestedValues;
      } else {
        // Initialize regular fields with saved content or default values
        content[field.id] = {
          ...field,
          collection_id: field.collection_id || null,
        };
      }
    });
  };

  useEffect(() => {
    // Initialize content with existing values (if any)
    const initialContent: Record<string, any> = {};
    const initialExpandedState: Record<string, boolean> = {};

    // Process sections to handle nested fields
    processedSections.forEach((section) => {
      // Expand all sections by default
      initialExpandedState[section.id] = true;

      // Initialize field values recursively
      initializeFieldValues(section.fields || [], initialContent);
    });

    setExpandedSections(initialExpandedState);
    initializeContent(originalFields);
  }, [pageId, existingContent, processedSections, initializeContent]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <ContentEditorHeader existingContent={existingContent} processedSections={processedSections} setExpandedSections={setExpandedSections} />

      {/* Content Sections */}
      <div className="space-y-6">
        {/* No Sections Found */}
        {processedSections.length === 0 ? (
          <NoSectionsFound />
        ) : (
          processedSections.map((section) => (
            <Card key={section.id}>
              <Collapsible open={expandedSections[section.id] || false} onOpenChange={() => toggleSection(section.id)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardTitle className="flex items-center gap-2">
                      {expandedSections[section.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      {section.name}
                      <Badge variant="outline" className="text-xs">
                        {section.fields?.length || 0} fields
                      </Badge>
                    </CardTitle>
                    {section.description && <p className="text-sm text-muted-foreground">{section.description}</p>}
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="space-y-4 pt-0">
                    {section.fields?.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No fields in this section.</p>
                    ) : (
                      section.fields?.map((field) => (
                        <div key={field.id}>
                          <RenderComponent
                            field={field}
                            value={getFieldValue(field.id)}
                            error={validationErrors[field.id]}
                            // Pass section context for nested sections
                            currentSection={section}
                            allSections={existingContent.sections || []}
                          />
                        </div>
                      ))
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))
        )}
      </div>

      {/* Success indicator */}
      {/* {!hasUnsavedChanges && !isLoading && Object.keys(contentValues).length > 0 && (
        <div className="flex items-center justify-center p-4 text-green-600">
          <CheckCircle2 className="h-4 w-4 mr-2" />
          <span className="text-sm">All changes saved</span>
        </div>
      )} */}
    </div>
  );
}
