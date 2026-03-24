import type {
  BuilderField,
  BuilderFieldType,
  ConditionalLogic,
  EditableSetting,
} from "./types";

export const LAYOUT_FIELD_TYPES: BuilderFieldType[] = ["heading", "paragraph", "divider", "section"];
export const NON_SUBMISSION_FIELD_TYPES: BuilderFieldType[] = [...LAYOUT_FIELD_TYPES];

const SHARED_NON_DIVIDER_SETTINGS: EditableSetting[] = ["width", "hidden", "conditionalLogic"];

export const FIELD_EDITABLE_SETTINGS: Record<BuilderFieldType, EditableSetting[]> = {
  text: [
    "minLength",
    "maxLength",
    "prefix",
    "suffix",
    "defaultValue",
    "readOnly",
    "autocomplete",
    ...SHARED_NON_DIVIDER_SETTINGS,
  ],
  email: ["minLength", "maxLength", "defaultValue", "readOnly", "autocomplete", ...SHARED_NON_DIVIDER_SETTINGS],
  textarea: ["minLength", "maxLength", "rows", "defaultValue", "readOnly", ...SHARED_NON_DIVIDER_SETTINGS],
  number: ["min", "max", "step", "prefix", "suffix", "defaultValue", "readOnly", ...SHARED_NON_DIVIDER_SETTINGS],
  checkbox: ["checkedValue", "uncheckedValue", "defaultValue", "readOnly", ...SHARED_NON_DIVIDER_SETTINGS],
  select: ["defaultValue", "searchable", ...SHARED_NON_DIVIDER_SETTINGS],
  date: ["minDate", "maxDate", "disabledDates", "dateFormat", "defaultValue", ...SHARED_NON_DIVIDER_SETTINGS],
  radio: ["defaultValue", ...SHARED_NON_DIVIDER_SETTINGS],
  multiselect: [
    "defaultValue",
    "searchable",
    "minSelections",
    "maxSelections",
    ...SHARED_NON_DIVIDER_SETTINGS,
  ],
  toggle: ["checkedValue", "uncheckedValue", "defaultValue", "readOnly", ...SHARED_NON_DIVIDER_SETTINGS],
  file: ["accept", "multiple", "maxFileSize", "maxFiles", ...SHARED_NON_DIVIDER_SETTINGS],
  phone: [
    "minLength",
    "maxLength",
    "prefix",
    "suffix",
    "defaultValue",
    "readOnly",
    "autocomplete",
    ...SHARED_NON_DIVIDER_SETTINGS,
  ],
  password: ["minLength", "maxLength", "autocomplete", ...SHARED_NON_DIVIDER_SETTINGS],
  url: ["minLength", "maxLength", "prefix", "defaultValue", "readOnly", "autocomplete", ...SHARED_NON_DIVIDER_SETTINGS],
  time: ["minTime", "maxTime", "timeStep", ...SHARED_NON_DIVIDER_SETTINGS],
  dateRange: [
    "minDate",
    "maxDate",
    "disabledDates",
    "dateFormat",
    "minRange",
    "maxRange",
    ...SHARED_NON_DIVIDER_SETTINGS,
  ],
  range: ["min", "max", "step", "prefix", "suffix", "defaultValue", ...SHARED_NON_DIVIDER_SETTINGS],
  rating: ["defaultValue", "maxRating", "ratingStep", "ratingIcon", ...SHARED_NON_DIVIDER_SETTINGS],
  heading: ["width", "hidden", "align", "headingLevel", "content", "conditionalLogic"],
  paragraph: ["width", "hidden", "align", "markdown", "content", "conditionalLogic"],
  divider: [],
  section: ["width", "hidden", "collapsible", "collapsed", "conditionalLogic"],
};

export function isLayoutFieldType(type: BuilderFieldType) {
  return LAYOUT_FIELD_TYPES.includes(type);
}

export function fieldSupportsKey(type: BuilderFieldType) {
  return !isLayoutFieldType(type);
}

export function fieldSupportsRequired(type: BuilderFieldType) {
  return !isLayoutFieldType(type);
}

export function getDefaultConditionalLogic(): ConditionalLogic {
  return {
    action: "show",
    match: "all",
    rules: [],
  };
}

export function slugifyFieldKey(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function createUniqueFieldKey(base: string, fields: BuilderField[], excludeFieldId?: string) {
  const slugBase = slugifyFieldKey(base) || "field";
  const taken = new Set(
    fields
      .filter((field) => field.id !== excludeFieldId)
      .map((field) => field.key)
      .filter((key): key is string => Boolean(key)),
  );

  if (!taken.has(slugBase)) {
    return slugBase;
  }

  let index = 2;
  while (taken.has(`${slugBase}_${index}`)) {
    index += 1;
  }

  return `${slugBase}_${index}`;
}

export function getFieldDisplayLabel(field: BuilderField, fallback: string) {
  if (field.type === "heading" || field.type === "paragraph") {
    return field.content || fallback;
  }

  return field.label || fallback;
}
