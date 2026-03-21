import type React from "react";

export type BuilderFieldType = "text" | "email" | "textarea" | "number" | "checkbox" | "select" | "date";

export interface BuilderField {
  id: string;
  type: BuilderFieldType;
  key: string;
  label: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  minDate?: string;
  maxDate?: string;
  checkedValue?: string;
  uncheckedValue?: string;
}

export interface HeadlessFormDesignerProps {
  value: BuilderField[];
  onChange: (value: BuilderField[]) => void;
}

export interface FieldSettingsProps {
  field: BuilderField;
  onChange: (patch: Partial<BuilderField>) => void;
}

export interface FieldTypeDefinition {
  type: BuilderFieldType;
  label: string;
  icon: React.ElementType;
  createField: (index: number) => BuilderField;
  SettingsComponent?: React.ComponentType<FieldSettingsProps>;
}
