import { Calendar, CheckSquare, ChevronsUpDown, Hash, Mail, Pilcrow, Type } from "lucide-react";
import { CheckboxFieldSettings } from "./field-settings/checkbox-field-settings";
import { DateFieldSettings } from "./field-settings/date-field-settings";
import { NumberFieldSettings } from "./field-settings/number-field-settings";
import { SelectFieldSettings } from "./field-settings/select-field-settings";
import type { BuilderField, BuilderFieldType, FieldTypeDefinition } from "./types";

function createDefaultField(type: BuilderFieldType, index: number): BuilderField {
  const baseLabel = `${type[0].toUpperCase()}${type.slice(1)} field`;
  return {
    id: crypto.randomUUID(),
    type,
    key: `${type}_${index + 1}`,
    label: baseLabel,
    required: false,
    placeholder: type === "checkbox" ? undefined : "Value here...",
    helpText: "Helper text",
  };
}

export const FIELD_TYPE_DEFINITIONS: Record<BuilderFieldType, FieldTypeDefinition> = {
  text: {
    type: "text",
    label: "Text Field",
    icon: Type,
    createField: (index) => createDefaultField("text", index),
  },
  email: {
    type: "email",
    label: "Email Field",
    icon: Mail,
    createField: (index) => createDefaultField("email", index),
  },
  textarea: {
    type: "textarea",
    label: "TextArea Field",
    icon: Pilcrow,
    createField: (index) => createDefaultField("textarea", index),
  },
  number: {
    type: "number",
    label: "Number Field",
    icon: Hash,
    createField: (index) => ({
      ...createDefaultField("number", index),
      min: undefined,
      max: undefined,
      step: 1,
    }),
    SettingsComponent: NumberFieldSettings,
  },
  checkbox: {
    type: "checkbox",
    label: "CheckBox Field",
    icon: CheckSquare,
    createField: (index) => ({
      ...createDefaultField("checkbox", index),
      checkedValue: "true",
      uncheckedValue: "false",
    }),
    SettingsComponent: CheckboxFieldSettings,
  },
  select: {
    type: "select",
    label: "Select Field",
    icon: ChevronsUpDown,
    createField: (index) => ({
      ...createDefaultField("select", index),
      options: ["Option 1", "Option 2"],
    }),
    SettingsComponent: SelectFieldSettings,
  },
  date: {
    type: "date",
    label: "Date Field",
    icon: Calendar,
    createField: (index) => ({
      ...createDefaultField("date", index),
      minDate: undefined,
      maxDate: undefined,
    }),
    SettingsComponent: DateFieldSettings,
  },
};

export const FIELD_PALETTE = Object.values(FIELD_TYPE_DEFINITIONS);

export function createFieldFromType(type: BuilderFieldType, index: number) {
  return FIELD_TYPE_DEFINITIONS[type].createField(index);
}

export function getFieldTypeDefinition(type: BuilderFieldType) {
  return FIELD_TYPE_DEFINITIONS[type];
}
