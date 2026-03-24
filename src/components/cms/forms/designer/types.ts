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

export type BuilderFieldWidth = "full" | "half" | "third";
export type BuilderFieldAlign = "left" | "center" | "right";
export type BuilderFieldAutocomplete =
  | "off"
  | "name"
  | "email"
  | "username"
  | "new-password"
  | "current-password"
  | "tel"
  | "url";
export type ConditionalLogicAction = "show" | "hide";
export type ConditionalLogicMatch = "all" | "any";
export type ConditionalLogicOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "is_empty"
  | "is_not_empty"
  | "greater_than"
  | "less_than"
  | "greater_than_or_equal"
  | "less_than_or_equal"
  | "file_count_equals"
  | "file_count_greater_than"
  | "file_count_less_than"
  | "file_size_less_than"
  | "file_size_greater_than";

export interface ConditionalLogicRule {
  field: string;
  operator: ConditionalLogicOperator;
  value?: string | number | boolean;
}

export interface ConditionalLogic {
  action: ConditionalLogicAction;
  match: ConditionalLogicMatch;
  rules: ConditionalLogicRule[];
}

export interface BuilderField {
  id: string;
  type: BuilderFieldType;
  key?: string;
  label?: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[];
  defaultValue?: string | number | boolean | string[] | { start: string; end: string };
  readOnly?: boolean;
  hidden?: boolean;
  width?: BuilderFieldWidth;
  conditionalLogic?: ConditionalLogic;
  min?: number;
  max?: number;
  step?: number;
  minLength?: number;
  maxLength?: number;
  rows?: number;
  prefix?: string;
  suffix?: string;
  autocomplete?: BuilderFieldAutocomplete;
  searchable?: boolean;
  minSelections?: number;
  maxSelections?: number;
  minDate?: string;
  maxDate?: string;
  disabledDates?: string[];
  dateFormat?: string;
  minTime?: string;
  maxTime?: string;
  timeStep?: number;
  minRange?: number;
  maxRange?: number;
  checkedValue?: string;
  uncheckedValue?: string;
  accept?: string;
  multiple?: boolean;
  maxFileSize?: number;
  maxFiles?: number;
  maxRating?: number;
  ratingStep?: number;
  ratingIcon?: string;
  content?: string;
  headingLevel?: number;
  align?: BuilderFieldAlign;
  markdown?: boolean;
  collapsible?: boolean;
  collapsed?: boolean;
}

export interface HeadlessFormDesignerProps {
  value: BuilderField[];
  onChange: (value: BuilderField[]) => void;
  submissionsCount?: number;
  initialFieldKeys?: Record<string, string | undefined>;
}

export interface FieldSettingsProps {
  field: BuilderField;
  onChange: (patch: Partial<BuilderField>) => void;
}

export const allFieldObjectProperties = [
  "id",
  "type",
  "key",
  "label",
  "required",
  "placeholder",
  "helpText",
  "options",
  "min",
  "max",
  "step",
  "minDate",
  "maxDate",
  "checkedValue",
  "uncheckedValue",
  "accept",
  "multiple",
  "maxRating",
  "content",
  "headingLevel",
  "minLength",
  "maxLength",
  "rows",
  "prefix",
  "suffix",
  "defaultValue",
  "readOnly",
  "hidden",
  "width",
  "autocomplete",
  "searchable",
  "minSelections",
  "maxSelections",
  "disabledDates",
  "dateFormat",
  "minTime",
  "maxTime",
  "timeStep",
  "minRange",
  "maxRange",
  "maxFileSize",
  "maxFiles",
  "ratingStep",
  "ratingIcon",
  "align",
  "markdown",
  "collapsible",
  "collapsed",
  "conditionalLogic",
] as const;

export type EditableSetting = (typeof allFieldObjectProperties)[number];

export interface FieldTypeDefinition {
  type: BuilderFieldType;
  label: string;
  icon: React.ElementType;
  createField: (index: number, fields?: BuilderField[]) => BuilderField;
  SettingsComponent?: React.ComponentType<FieldSettingsProps>;
  editableSettings?: EditableSetting[];
  supportsLabel?: boolean;
  supportsKey?: boolean;
  supportsPlaceholder?: boolean;
  supportsHelpText?: boolean;
  supportsRequired?: boolean;
}
