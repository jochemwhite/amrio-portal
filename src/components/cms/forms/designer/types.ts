import type React from "react";

export type BuilderFieldType =
  | "text"
  | "email"
  | "textarea"
  | "number"
  | "checkbox"
  | "select"
  | "date"
  | "radio"
  | "multiselect"
  | "toggle"
  | "file"
  | "phone"
  | "password"
  | "url"
  | "time"
  | "dateRange"
  | "range"
  | "rating"
  | "heading"
  | "paragraph"
  | "divider"
  | "section";

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
  accept?: string;
  multiple?: boolean;
  maxRating?: number;
  content?: string;
  headingLevel?: number;
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
  supportsLabel?: boolean;
  supportsKey?: boolean;
  supportsPlaceholder?: boolean;
  supportsHelpText?: boolean;
  supportsRequired?: boolean;
}
