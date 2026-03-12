import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { RPCPageField, RPCPageSection } from "@/types/cms";
import { ChevronDown, ChevronRight, FolderOpen } from "lucide-react";
import { useState } from "react";
import RenderComponent from "../content-editor/RenderComponent";

interface SectionFieldProps {
  field: RPCPageField;
  fieldId: string;
  value: any; // This will store the values for nested fields
  error?: string;
  handleFieldChange: (fieldId: string, value: any) => void;
  handleFieldBlur: (field: any) => void;
  // Additional props needed for section nesting
  currentSection?: RPCPageSection;
  allSections?: RPCPageSection[];
  nestingLevel?: number; // Track nesting depth for styling
}

export default function SectionField({
  field,
  fieldId,
  value,
  error,
  handleFieldChange,
  handleFieldBlur,
  currentSection,
  allSections = [],
}: SectionFieldProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Check if this field has its own nested fields defined
  const hasNestedFields = field.fields && field.fields.length > 0;

  if (!hasNestedFields) {
    return (
      <div className="space-y-2">
        <Label htmlFor={fieldId}>
          {field.name}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <div className="p-4 border border-dashed rounded-md">
          <p className="text-sm text-muted-foreground">This section field has no nested fields defined.</p>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>
        {field.required && <span className="text-destructive ml-1">*</span>}
        <Badge variant="outline" className="ml-2 text-xs">
          {field.fields?.length || 0} fields
        </Badge>
      </Label>

      <Card>
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer transition-colors">
              <CardTitle className="text-sm flex items-center gap-2">
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <FolderOpen className="h-4 w-4" />
                {field.name}
                <Badge variant="secondary" className="text-xs">
                  Section
                </Badge>
              </CardTitle>
              {field.description && <p className="text-xs">{field.description}</p>}
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              {field.fields?.map((nestedField: RPCPageField) => (
                <div key={nestedField.id} className="pl-4 ">
                  <RenderComponent
                    field={{
                      ...nestedField,
                      default_value: nestedField.default_value ?? "",
                      validation: nestedField.validation ?? "",
                      order: nestedField.order || 0,
                    }}
                    value={value?.[nestedField.id]}
                    currentSection={currentSection}
                    allSections={allSections}
                  />
                </div>
              ))}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
    </div>
  );
}
