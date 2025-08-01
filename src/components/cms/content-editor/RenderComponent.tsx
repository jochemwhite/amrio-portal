import { useContentEditorStore } from "@/stores/useContentEditorStore";
import { SupabaseField } from "@/types/cms";

interface RenderComponentProps {
  field: SupabaseField;
  value?: any;
  error?: string;
  onFieldChange?: (fieldId: string, value: any) => void;
  onFieldBlur?: (field: SupabaseField) => void;
  // Additional props for nested sections
  currentSection?: any;
  allSections?: any[];
}

export default function RenderComponent({ 
  field, 
  value, 
  error, 
  onFieldChange, 
  onFieldBlur,
  currentSection,
  allSections 
}: RenderComponentProps) {
  const { getFieldComponent, getFieldValue, setFieldValue, validateField } = useContentEditorStore();

  const Component = getFieldComponent(field);
  const fieldValue = value ?? getFieldValue(field.id);

  const handleFieldChange = onFieldChange || ((fieldId: string, newValue: any) => {
    setFieldValue(fieldId, newValue);
  });

  const handleFieldBlur = onFieldBlur || ((field: SupabaseField) => {
    // Optional: trigger validation on blur
    const validationError = validateField(field.id, field);
    console.log("Field validation:", validationError);
  });

  if (!Component) {
    return (
      <div className="p-4 border border-dashed border-gray-300 rounded-md">
        <p className="text-sm text-gray-500">
          No component found for field type: {field.type}
        </p>
      </div>
    );
  }

  return (
    <Component
      field={field}
      fieldId={field.id}
      value={fieldValue}
      error={error}
      handleFieldChange={handleFieldChange}
      handleFieldBlur={handleFieldBlur}
      currentSection={currentSection}
      allSections={allSections}
    />
  );
}
