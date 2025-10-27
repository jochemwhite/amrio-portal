import { useContentEditorStore } from "@/stores/useContentEditorStore";
import { RPCPageField, RPCPageSection, SupabaseField } from "@/types/cms";
import { Json } from "@/types/supabase";

interface RenderComponentProps {
  field: RPCPageField;
  value?: Json;  
  currentSection?: RPCPageSection;
  allSections?: RPCPageSection[];
}

export default function RenderComponent({ field, value, currentSection, allSections }: RenderComponentProps) {
  const { getFieldComponent, getFieldValue, setFieldValue } = useContentEditorStore();

  const Component = getFieldComponent(field);
  const fieldValue = value ?? getFieldValue(field.id);

  const handleFieldChange = (fieldId: string, newValue: Json) => {
    setFieldValue(fieldId, newValue);
  };

  if (!Component) {
    return (
      <div className="p-4 border border-dashed border-gray-300 rounded-md">
        <p className="text-sm text-gray-500">No component found for field type: {field.type}</p>
      </div>
    );
  }

  return (
    <Component
      field={field}
      fieldId={field.id}
      value={fieldValue}
      handleFieldChange={handleFieldChange}
      currentSection={currentSection}
      allSections={allSections}
    />
  );
}
