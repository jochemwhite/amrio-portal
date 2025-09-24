"use client";

import { useContentEditorStore } from "@/stores/useContentEditorStore";
import { SupabasePageWithRelations, RPCPageResponse } from "@/types/cms";
import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Save, RotateCcw, AlertCircle, CheckCircle2, ChevronDown, ChevronRight, Expand, Minimize } from "lucide-react";
import RenderComponent from "./RenderComponent";
import { toast } from "sonner";

interface ContentEditorProps {
  pageId: string;
  existingContent: RPCPageResponse;
}

export function ContentEditor({ pageId, existingContent }: ContentEditorProps) {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const {
    hasUnsavedChanges,
    isSaving,
    isLoading,
    initializeContent,
    contentValues,
    saveContent,
    resetAllFields,
    validateAllFields,
  } = useContentEditorStore();

  // The RPC response already has the nested structure built-in
  const processedSections = useMemo(() => {
    return existingContent.sections || [];
  }, [existingContent.sections]);

  // Helper function to extract value from content based on field type
  const extractValueFromContent = (field: any): any => {
    if (!field.content || field.content === null) {
      return field.default_value || "";
    }

    switch (field.type) {
      case 'text':
      case 'number':
      case 'boolean':
      case 'date':
        return field.content.value !== undefined ? field.content.value : field.default_value || "";
      
      case 'richtext':
        return field.content.content !== undefined ? field.content.content : field.default_value || "";
      
      case 'image':
      case 'video':
        return field.content.url !== undefined ? field.content.url : 
               field.content.value !== undefined ? field.content.value : field.default_value || "";
      
      case 'reference':
        return field.content.id !== undefined ? field.content.id : 
               field.content.value !== undefined ? field.content.value : field.default_value || "";
      
      case 'section':
        return ""; // Section fields don't have content
      
      default:
        // For unknown types, try to extract value or return as-is
        return field.content.value !== undefined ? field.content.value : 
               field.content !== null ? field.content : field.default_value || "";
    }
  };

  // Helper function to recursively initialize field values
  const initializeFieldValues = (fields: any[], content: Record<string, any>) => {
    fields.forEach(field => {
      if (field.type === 'section' && field.fields) {
        // Initialize nested section field with an object containing its nested fields
        const nestedValues: Record<string, any> = {};
        initializeFieldValues(field.fields, nestedValues);
        content[field.id] = nestedValues;
      } else {
        // Initialize regular fields with saved content or default values
        content[field.id] = extractValueFromContent(field);
      }
    });
  };

  useEffect(() => {
    // Initialize content with existing values (if any)
    const initialContent: Record<string, any> = {};
    const initialExpandedState: Record<string, boolean> = {};
    
    // Process sections to handle nested fields
    processedSections.forEach(section => {
      // Expand all sections by default
      initialExpandedState[section.id] = true;
      
      // Initialize field values recursively
      initializeFieldValues(section.fields || [], initialContent);
    });
     
    setExpandedSections(initialExpandedState);
    initializeContent(pageId, initialContent);
  }, [pageId, processedSections, initializeContent]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const expandAllSections = () => {
    const allExpanded: Record<string, boolean> = {};
    processedSections.forEach(section => {
      allExpanded[section.id] = true;
    });
    setExpandedSections(allExpanded);
  };

  const collapseAllSections = () => {
    const allCollapsed: Record<string, boolean> = {};
    processedSections.forEach(section => {
      allCollapsed[section.id] = false;
    });
    setExpandedSections(allCollapsed);
  };

  const handleSave = async () => {
    // Validate all fields before saving
    const errors = validateAllFields(existingContent.sections || []);
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      toast.error("Please fix validation errors before saving");
      return;
    }
    
    await saveContent();
    setValidationErrors({});
  };

  const handleReset = () => {
    resetAllFields();
    setValidationErrors({});
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content Editor</h1>
          <p className="text-muted-foreground">
            Edit content for "{existingContent.name}"
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <Badge variant="secondary" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Unsaved changes
            </Badge>
          )}
          
          {/* Section Controls */}
          {processedSections.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={expandAllSections}
                className="gap-1 text-xs"
              >
                <Expand className="h-3 w-3" />
                Expand All
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={collapseAllSections}
                className="gap-1 text-xs"
              >
                <Minimize className="h-3 w-3" />
                Collapse All
              </Button>
            </>
          )}
          
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasUnsavedChanges || isSaving}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content Sections */}
      <div className="space-y-6">
        {processedSections.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                No content sections found. Please add sections in the Schema Builder first.
              </p>
            </CardContent>
          </Card>
        ) : (
          processedSections.map((section) => (
            <Card key={section.id}>
              <Collapsible
                open={expandedSections[section.id] || false}
                onOpenChange={() => toggleSection(section.id)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardTitle className="flex items-center gap-2">
                      {expandedSections[section.id] ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      {section.name}
                      <Badge variant="outline" className="text-xs">
                        {section.fields?.length || 0} fields
                      </Badge>
                    </CardTitle>
                    {section.description && (
                      <p className="text-sm text-muted-foreground">
                        {section.description}
                      </p>
                    )}
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="space-y-4 pt-0">
                    {section.fields?.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">
                        No fields in this section.
                      </p>
                    ) : (
                      section.fields?.map((field) => (
                        <div key={field.id}>
                          <RenderComponent
                            field={field}
                            value={contentValues[field.id]}
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
      {!hasUnsavedChanges && !isLoading && Object.keys(contentValues).length > 0 && (
        <div className="flex items-center justify-center p-4 text-green-600">
          <CheckCircle2 className="h-4 w-4 mr-2" />
          <span className="text-sm">All changes saved</span>
        </div>
      )}
    </div>
  );
} 