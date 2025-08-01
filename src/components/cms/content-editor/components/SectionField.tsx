import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, FolderOpen, AlertTriangle } from "lucide-react";
import React, { useState } from "react";
import { Section } from "@/types/cms";
import { getAvailableSectionsForNesting, MAX_NESTING_DEPTH, calculateSectionDepth } from "../../shared/section-utils";
import RenderComponent from "../RenderComponent";

interface SectionFieldProps {
  field: {
    id: string;
    name: string;
    type: string;
    required?: boolean;
    default_value?: string;
    description?: string;
  };
  fieldId: string;
  value: any; // This will be a Section object or null
  error?: string;
  handleFieldChange: (fieldId: string, value: any) => void;
  handleFieldBlur: (field: any) => void;
  // Additional props needed for section nesting
  currentSection?: Section;
  allSections?: Section[];
}

export default function SectionField({ 
  field, 
  fieldId, 
  value, 
  error, 
  handleFieldChange, 
  handleFieldBlur,
  currentSection,
  allSections = []
}: SectionFieldProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const selectedSection = value as Section | null;
  
  // Get sections that can be safely nested
  const availableSections = currentSection 
    ? getAvailableSectionsForNesting(currentSection, allSections)
    : allSections;

  const currentDepth = currentSection ? calculateSectionDepth(currentSection) : 0;
  const canNestMore = currentDepth < MAX_NESTING_DEPTH;

  const handleSectionSelect = (sectionId: string) => {
    const section = allSections.find(s => s.id === sectionId);
    if (section) {
      // Create a copy with proper nesting metadata
      const nestedSection: Section = {
        ...section,
        parentSectionId: currentSection?.id,
        depth: (currentSection?.depth || 0) + 1,
      };
      handleFieldChange(field.id, nestedSection);
    }
  };

  const handleRemoveSection = () => {
    handleFieldChange(field.id, null);
    setIsExpanded(false);
  };

  if (!canNestMore) {
    return (
      <div className="space-y-2">
        <Label htmlFor={fieldId}>
          {field.name}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        
        <div className="p-4 border border-dashed border-yellow-300 rounded-md bg-yellow-50">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm">
              Maximum nesting depth ({MAX_NESTING_DEPTH}) reached. Cannot add more nested sections.
            </p>
          </div>
        </div>
        
        {error && <p className="text-sm text-destructive">{error}</p>}
        {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>
        {field.name}
        {field.required && <span className="text-destructive ml-1">*</span>}
        <Badge variant="secondary" className="ml-2 text-xs">
          Depth: {currentDepth + 1}/{MAX_NESTING_DEPTH}
        </Badge>
      </Label>

      {!selectedSection ? (
        <div className="space-y-2">
          <Select
            value=""
            onValueChange={handleSectionSelect}
            onOpenChange={() => handleFieldBlur(field)}
          >
            <SelectTrigger className={error ? "border-destructive" : ""}>
              <SelectValue placeholder="Select a section to nest..." />
            </SelectTrigger>
            <SelectContent>
              {availableSections.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">
                  No sections available for nesting
                </div>
              ) : (
                availableSections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-3 w-3" />
                      <span>{section.name}</span>
                      {section.description && (
                        <span className="text-xs text-muted-foreground">
                          - {section.description}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          
          {availableSections.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No sections available. Sections cannot nest themselves or create loops.
            </p>
          )}
        </div>
      ) : (
        <Card className="border-blue-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                {selectedSection.name}
                <Badge variant="outline" className="text-xs">
                  Nested Section
                </Badge>
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveSection}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            {selectedSection.description && (
              <p className="text-xs text-muted-foreground">
                {selectedSection.description}
              </p>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-fit text-xs"
            >
              {isExpanded ? 'Collapse' : 'Expand'} Fields ({selectedSection.fields?.length || 0})
            </Button>
          </CardHeader>
          
          {isExpanded && (
            <CardContent className="pt-0 space-y-4 bg-blue-50/30">
              {selectedSection.fields?.map((nestedField) => (
                <div key={nestedField.id} className="pl-4 border-l-2 border-blue-200">
                  <RenderComponent
                    field={{
                      id: `${selectedSection.id}.${nestedField.id}`,
                      section_id: selectedSection.id,
                      name: nestedField.name,
                      type: nestedField.type,
                      required: nestedField.required,
                      default_value: nestedField.defaultValue,
                      order: nestedField.order || 0,
                    }}
                  />
                </div>
              )) || (
                <p className="text-sm text-muted-foreground italic pl-4">
                  This section has no fields yet.
                </p>
              )}
              
              {/* Render nested sections recursively */}
              {selectedSection.sections?.map((nestedSection) => (
                <div key={nestedSection.id} className="pl-4 border-l-2 border-blue-200">
                  <SectionField
                    field={{
                      id: `nested_section_${nestedSection.id}`,
                      name: `Nested: ${nestedSection.name}`,
                      type: "section",
                    }}
                    fieldId={`nested_section_${nestedSection.id}`}
                    value={nestedSection}
                    handleFieldChange={() => {}} // Read-only for nested display
                    handleFieldBlur={handleFieldBlur}
                    currentSection={nestedSection}
                    allSections={allSections}
                  />
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
    </div>
  );
}