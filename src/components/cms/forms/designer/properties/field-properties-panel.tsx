import { useEffect, useMemo, useState, type ReactNode } from "react";
import { format } from "date-fns";
import {
  CalendarPlus,
  ChevronDown,
  Info,
  Plus,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  FIELD_EDITABLE_SETTINGS,
  getDefaultConditionalLogic,
  slugifyFieldKey,
} from "../field-helpers";
import { getFieldTypeDefinition } from "../field-type-registry";
import type {
  BuilderField,
  ConditionalLogicOperator,
  EditableSetting,
} from "../types";

interface FieldPropertiesPanelProps {
  selectedField: BuilderField | null;
  allFields: BuilderField[];
  submissionsCount?: number;
  initialFieldKeys?: Record<string, string | undefined>;
  onConditionalLogicOpenChange?: (open: boolean) => void;
  onUpdateField: (id: string, patch: Partial<BuilderField>) => void;
  onRemoveField: (id: string) => void;
}

const SECTION_SETTINGS = {
  Basic: ["label", "key", "placeholder", "helpText", "required"],
  Validation: [
    "minLength",
    "maxLength",
    "min",
    "max",
    "step",
    "minSelections",
    "maxSelections",
    "minRange",
    "maxRange",
    "minDate",
    "maxDate",
    "minTime",
    "maxTime",
    "timeStep",
    "disabledDates",
    "dateFormat",
    "accept",
    "maxFileSize",
    "maxFiles",
  ],
  Appearance: [
    "width",
    "align",
    "rows",
    "prefix",
    "suffix",
    "headingLevel",
    "ratingIcon",
    "maxRating",
    "ratingStep",
    "markdown",
    "collapsible",
    "collapsed",
  ],
  Behavior: [
    "defaultValue",
    "readOnly",
    "hidden",
    "searchable",
    "autocomplete",
    "checkedValue",
    "uncheckedValue",
    "multiple",
    "content",
  ],
  "Conditional Logic": ["conditionalLogic"],
} as const satisfies Record<string, string[]>;

const TOOLTIP_COPY: Partial<
  Record<
    EditableSetting | "label" | "key" | "placeholder" | "helpText" | "required",
    string
  >
> = {
  label: "Visible label shown above the field in the form.",
  key: "Submission storage key. It must stay unique and slug-safe within this form.",
  placeholder: "Hint text shown before the user enters a value.",
  helpText: "Supporting guidance shown below the field.",
  required: "Marks the field as required before a submission can be accepted.",
  defaultValue: "Pre-filled value used when the form first renders.",
  readOnly: "Users can view the field value but not change it.",
  hidden: "Keeps the field in the schema while hiding it from the form UI.",
  width: "Layout width used in the builder and rendered form.",
  minLength: "Minimum number of characters allowed.",
  maxLength: "Maximum number of characters allowed.",
  rows: "Visible height for textareas in rows.",
  prefix: "Text shown before the input value.",
  suffix: "Text shown after the input value.",
  autocomplete: "Browser autocomplete hint for the field.",
  searchable: "Allows searching inside long option lists.",
  minSelections: "Minimum number of selections a user must make.",
  maxSelections: "Maximum number of selections a user can make.",
  disabledDates: "Dates that should not be selectable.",
  dateFormat: "Display format used when rendering the chosen date.",
  minTime: "Earliest allowed time.",
  maxTime: "Latest allowed time.",
  timeStep: "Time increments in minutes.",
  minRange: "Minimum allowed length for a date range.",
  maxRange: "Maximum allowed length for a date range.",
  maxFileSize: "Maximum file size allowed, in MB.",
  maxFiles: "Maximum number of uploaded files.",
  maxRating: "Highest rating a user can choose.",
  ratingStep: "Increment between rating choices.",
  ratingIcon: "Visual icon style used for the rating control.",
  align: "Text alignment for content blocks.",
  markdown: "Treat paragraph content as Markdown when rendered.",
  collapsible: "Allows a section block to be expanded or collapsed.",
  collapsed: "Initial collapsed state for a collapsible section.",
  conditionalLogic: "Show or hide the field based on values in other fields.",
  min: "Minimum numeric value allowed.",
  max: "Maximum numeric value allowed.",
  step: "Step size for numeric or range inputs.",
  minDate: "Earliest date a user can select.",
  maxDate: "Latest date a user can select.",
  accept: "Allowed file MIME types or extensions.",
  checkedValue: "Stored value when the control is checked or enabled.",
  uncheckedValue: "Stored value when the control is unchecked or disabled.",
  multiple: "Allows more than one uploaded file.",
  content: "Text content for layout blocks.",
  headingLevel: "Semantic heading level used for the heading block.",
};

const WIDTH_OPTIONS = [
  { value: "full", label: "Full width" },
  { value: "half", label: "Half width" },
  { value: "third", label: "Third width" },
] as const;

const ALIGN_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
] as const;

const AUTOCOMPLETE_OPTIONS = [
  { value: "off", label: "Off" },
  { value: "name", label: "Name" },
  { value: "email", label: "Email" },
  { value: "username", label: "Username" },
  { value: "new-password", label: "New password" },
  { value: "current-password", label: "Current password" },
  { value: "tel", label: "Telephone" },
  { value: "url", label: "URL" },
] as const;

const DATE_FORMAT_OPTIONS = [
  { value: "yyyy-MM-dd", label: "YYYY-MM-DD" },
  { value: "MM/dd/yyyy", label: "MM/DD/YYYY" },
  { value: "dd/MM/yyyy", label: "DD/MM/YYYY" },
] as const;

const RATING_ICON_OPTIONS = [
  { value: "star", label: "Star" },
  { value: "heart", label: "Heart" },
  { value: "thumb", label: "Thumb" },
] as const;

const RULE_OPERATORS: { value: ConditionalLogicOperator; label: string }[] = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not equals" },
  { value: "contains", label: "Contains" },
  { value: "not_contains", label: "Not contains" },
  { value: "starts_with", label: "Starts with" },
  { value: "ends_with", label: "Ends with" },
  { value: "is_empty", label: "Is empty" },
  { value: "is_not_empty", label: "Is not empty" },
  { value: "greater_than", label: "Greater than" },
  { value: "less_than", label: "Less than" },
  { value: "greater_than_or_equal", label: "Greater than or equal" },
  { value: "less_than_or_equal", label: "Less than or equal" },
  { value: "file_count_equals", label: "File count equals" },
  { value: "file_count_greater_than", label: "File count greater than" },
  { value: "file_count_less_than", label: "File count less than" },
  { value: "file_size_less_than", label: "File size less than" },
  { value: "file_size_greater_than", label: "File size greater than" },
];

const OPERATORS_BY_TYPE: Partial<
  Record<BuilderField["type"], ConditionalLogicOperator[]>
> = {
  text: [
    "equals",
    "not_equals",
    "contains",
    "not_contains",
    "starts_with",
    "ends_with",
    "is_empty",
    "is_not_empty",
  ],
  email: ["equals", "not_equals", "contains", "is_empty", "is_not_empty"],
  textarea: ["contains", "not_contains", "is_empty", "is_not_empty"],
  url: ["equals", "not_equals", "contains", "is_empty", "is_not_empty"],
  phone: ["equals", "not_equals", "is_empty", "is_not_empty"],
  password: ["is_empty", "is_not_empty"],
  number: [
    "equals",
    "not_equals",
    "greater_than",
    "less_than",
    "greater_than_or_equal",
    "less_than_or_equal",
    "is_empty",
    "is_not_empty",
  ],
  range: [
    "equals",
    "greater_than",
    "less_than",
    "greater_than_or_equal",
    "less_than_or_equal",
  ],
  rating: [
    "equals",
    "not_equals",
    "greater_than",
    "less_than",
    "greater_than_or_equal",
    "less_than_or_equal",
  ],
  select: ["equals", "not_equals", "is_empty", "is_not_empty"],
  multiselect: ["contains", "not_contains", "is_empty", "is_not_empty"],
  radio: ["equals", "not_equals", "is_empty", "is_not_empty"],
  checkbox: ["equals"],
  toggle: ["equals"],
  date: [
    "equals",
    "not_equals",
    "greater_than",
    "less_than",
    "is_empty",
    "is_not_empty",
  ],
  dateRange: ["is_empty", "is_not_empty"],
  time: ["equals", "not_equals", "greater_than", "less_than"],
  file: [
    "is_empty",
    "is_not_empty",
    "file_count_equals",
    "file_count_greater_than",
    "file_count_less_than",
    "file_size_less_than",
    "file_size_greater_than",
  ],
};

const MIME_GROUPS = [
  {
    label: "Images",
    types: [
      { label: "JPEG", value: "image/jpeg" },
      { label: "PNG", value: "image/png" },
      { label: "GIF", value: "image/gif" },
      { label: "WebP", value: "image/webp" },
      { label: "SVG", value: "image/svg+xml" },
      { label: "AVIF", value: "image/avif" },
    ],
  },
  {
    label: "Documents",
    types: [
      { label: "PDF", value: "application/pdf" },
      {
        label: "Word (.docx)",
        value:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
      { label: "Word (.doc)", value: "application/msword" },
      {
        label: "Excel (.xlsx)",
        value:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
      { label: "Excel (.xls)", value: "application/vnd.ms-excel" },
      {
        label: "PowerPoint (.pptx)",
        value:
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      },
      { label: "Plain text", value: "text/plain" },
      { label: "CSV", value: "text/csv" },
    ],
  },
  {
    label: "Video",
    types: [
      { label: "MP4", value: "video/mp4" },
      { label: "WebM", value: "video/webm" },
      { label: "MOV", value: "video/quicktime" },
      { label: "AVI", value: "video/x-msvideo" },
    ],
  },
  {
    label: "Audio",
    types: [
      { label: "MP3", value: "audio/mpeg" },
      { label: "WAV", value: "audio/wav" },
      { label: "OGG", value: "audio/ogg" },
      { label: "AAC", value: "audio/aac" },
    ],
  },
  {
    label: "Archives",
    types: [
      { label: "ZIP", value: "application/zip" },
      { label: "RAR", value: "application/vnd.rar" },
      { label: "7Z", value: "application/x-7z-compressed" },
      { label: "TAR", value: "application/x-tar" },
    ],
  },
] as const;

const KNOWN_MIME_TYPES = new Set<string>(
  MIME_GROUPS.flatMap((group) => group.types.map((type) => type.value)),
);
const FILE_SIZE_UNITS = [
  { value: "KB", multiplier: 1024 },
  { value: "MB", multiplier: 1024 * 1024 },
] as const;

function toNumber(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getOperatorsForField(field?: BuilderField | null) {
  if (!field) return ["equals"] satisfies ConditionalLogicOperator[];
  return OPERATORS_BY_TYPE[field.type] ?? ["equals"];
}

function normalizeOperator(
  field: BuilderField | null | undefined,
  operator: string | undefined,
) {
  const operators = getOperatorsForField(field);
  return operator && operators.includes(operator as ConditionalLogicOperator)
    ? (operator as ConditionalLogicOperator)
    : operators[0];
}

function parseAcceptValue(value?: string) {
  const all = (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    known: all.filter((item) => KNOWN_MIME_TYPES.has(item)),
    custom: all.filter((item) => !KNOWN_MIME_TYPES.has(item)),
  };
}

function buildAcceptValue(known: string[], custom: string[]) {
  return [...new Set([...known, ...custom].filter(Boolean))].join(",");
}

function bytesToUnitValue(bytes?: number) {
  if (!bytes) {
    return { size: "", unit: "MB" as const };
  }

  if (bytes % (1024 * 1024) === 0) {
    return { size: String(bytes / (1024 * 1024)), unit: "MB" as const };
  }

  return {
    size: String(Math.round((bytes / 1024) * 100) / 100),
    unit: "KB" as const,
  };
}

function FieldSettingLabel({
  label,
  helpText,
}: {
  label: string;
  helpText?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {helpText ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="text-muted-foreground transition hover:text-foreground"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={6}>
            {helpText}
          </TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
}

function Section({
  title,
  children,
  defaultOpen = true,
  open,
  onOpenChange,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      className="rounded-lg border border-border/70 bg-background/50"
    >
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="flex w-full items-center justify-between rounded-lg px-3 py-2"
        >
          <span className="text-xs font-medium text-muted-foreground">
            {title}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 px-3 pb-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function FieldPropertiesPanel({
  selectedField,
  allFields,
  submissionsCount = 0,
  initialFieldKeys = {},
  onConditionalLogicOpenChange,
  onUpdateField,
  onRemoveField,
}: FieldPropertiesPanelProps) {
  if (!selectedField) {
    return (
      <p className="text-sm text-muted-foreground">
        Select a field in the canvas to edit its properties.
      </p>
    );
  }

  const definition = getFieldTypeDefinition(selectedField.type);
  const editableSettings =
    definition.editableSettings ??
    FIELD_EDITABLE_SETTINGS[selectedField.type] ??
    [];
  const otherFieldKeys = allFields
    .filter((field) => field.id !== selectedField.id && field.key)
    .map((field) => field.key as string);
  const keyIsDuplicate = selectedField.key
    ? otherFieldKeys.includes(selectedField.key)
    : false;
  const originalKey = initialFieldKeys[selectedField.id];
  const keyChangedWithSubmissions =
    submissionsCount > 0 &&
    Boolean(originalKey) &&
    originalKey !== selectedField.key;
  const conditionalLogic =
    selectedField.conditionalLogic ?? getDefaultConditionalLogic();
  const [conditionalLogicOpen, setConditionalLogicOpen] = useState(false);
  const [customMimeInput, setCustomMimeInput] = useState("");
  const conditionalFields = useMemo(
    () =>
      allFields
        .filter((field) => field.id !== selectedField.id && field.key)
        .map((field) => ({
          ...field,
          key: field.key as string,
          label: field.label || field.content || field.key || "Untitled field",
        })),
    [allFields, selectedField.id],
  );
  const { known: selectedMimeTypes, custom: customMimeTypes } = useMemo(
    () => parseAcceptValue(selectedField.accept),
    [selectedField.accept],
  );

  useEffect(() => {
    onConditionalLogicOpenChange?.(conditionalLogicOpen);
  }, [conditionalLogicOpen, onConditionalLogicOpenChange]);

  useEffect(() => {
    if (!selectedField.conditionalLogic) return;

    const normalizedRules = selectedField.conditionalLogic.rules.map((rule) => {
      const targetField =
        conditionalFields.find((field) => field.key === rule.field) ?? null;
      const operator = normalizeOperator(targetField, rule.operator);
      return operator === rule.operator ? rule : { ...rule, operator };
    });

    const hasChanges = normalizedRules.some(
      (rule, index) =>
        rule.operator !==
        selectedField.conditionalLogic?.rules[index]?.operator,
    );
    if (!hasChanges) return;

    onUpdateField(selectedField.id, {
      conditionalLogic: {
        ...selectedField.conditionalLogic,
        rules: normalizedRules,
      },
    });
  }, [conditionalFields, onUpdateField, selectedField]);

  const updateNumberSetting = (setting: EditableSetting, value: string) => {
    onUpdateField(selectedField.id, {
      [setting]: toNumber(value),
    } as Partial<BuilderField>);
  };

  const updateBooleanSetting = (setting: EditableSetting, checked: boolean) => {
    onUpdateField(selectedField.id, {
      [setting]: checked,
    } as Partial<BuilderField>);
  };

  const updateTextSetting = (setting: EditableSetting, value: string) => {
    onUpdateField(selectedField.id, {
      [setting]: value || undefined,
    } as Partial<BuilderField>);
  };

  const updateOptions = (options: string[]) => {
    onUpdateField(selectedField.id, { options });
  };

  const updateAcceptValue = (known: string[], custom: string[]) => {
    onUpdateField(selectedField.id, {
      accept: buildAcceptValue(known, custom) || undefined,
    });
  };

  const addOption = () => {
    updateOptions([
      ...(selectedField.options ?? []),
      `Option ${(selectedField.options ?? []).length + 1}`,
    ]);
  };

  const sectionSettings = Object.entries(SECTION_SETTINGS).map(
    ([title, settings]) => {
      const visibleSettings = settings.filter((setting) => {
        if (setting === "label") return definition.supportsLabel !== false;
        if (setting === "key") return definition.supportsKey !== false;
        if (setting === "placeholder")
          return definition.supportsPlaceholder === true;
        if (setting === "helpText") return definition.supportsHelpText === true;
        if (setting === "required") return definition.supportsRequired === true;
        return editableSettings.includes(setting as EditableSetting);
      });

      return { title, settings: visibleSettings };
    },
  );

  const renderSetting = (setting: string) => {
    const helpText = TOOLTIP_COPY[setting as keyof typeof TOOLTIP_COPY];

    if (setting === "label") {
      return (
        <div key={setting} className="space-y-1.5">
          <FieldSettingLabel label="Label" helpText={helpText} />
          <Input
            value={selectedField.label ?? ""}
            onChange={(event) =>
              onUpdateField(selectedField.id, {
                label: event.target.value || undefined,
              })
            }
          />
        </div>
      );
    }

    if (setting === "key") {
      return (
        <div key={setting} className="space-y-1.5">
          <FieldSettingLabel label="Key" helpText={helpText} />
          <Input
            value={selectedField.key ?? ""}
            onChange={(event) => {
              const slug = slugifyFieldKey(event.target.value);
              onUpdateField(selectedField.id, { key: slug });
            }}
          />
          {keyIsDuplicate ? (
            <p className="text-xs text-destructive">
              This key is already used by another field.
            </p>
          ) : null}
        </div>
      );
    }

    if (
      setting === "placeholder" ||
      setting === "helpText" ||
      setting === "prefix" ||
      setting === "suffix"
    ) {
      return (
        <div key={setting} className="space-y-1.5">
          <FieldSettingLabel label={toLabel(setting)} helpText={helpText} />
          <Input
            value={
              (selectedField[setting as keyof BuilderField] as
                | string
                | undefined) ?? ""
            }
            onChange={(event) =>
              updateTextSetting(setting as EditableSetting, event.target.value)
            }
          />
        </div>
      );
    }

    if (setting === "required") {
      return (
        <div
          key={setting}
          className="flex items-center justify-between rounded-md border border-border/70 px-3 py-2"
        >
          <div>
            <FieldSettingLabel label="Required" helpText={helpText} />
          </div>
          <Switch
            checked={Boolean(selectedField.required)}
            onCheckedChange={(checked) =>
              onUpdateField(selectedField.id, { required: checked })
            }
          />
        </div>
      );
    }

    if (
      [
        "readOnly",
        "hidden",
        "searchable",
        "multiple",
        "markdown",
        "collapsible",
        "collapsed",
      ].includes(setting)
    ) {
      return (
        <div
          key={setting}
          className="flex items-center justify-between rounded-md border border-border/70 px-3 py-2"
        >
          <FieldSettingLabel label={toLabel(setting)} helpText={helpText} />
          <Switch
            checked={Boolean(selectedField[setting as keyof BuilderField])}
            onCheckedChange={(checked) =>
              updateBooleanSetting(setting as EditableSetting, checked)
            }
          />
        </div>
      );
    }

    if (
      [
        "min",
        "max",
        "step",
        "minLength",
        "maxLength",
        "rows",
        "minSelections",
        "maxSelections",
        "minRange",
        "maxRange",
        "maxFileSize",
        "maxFiles",
        "maxRating",
        "ratingStep",
        "timeStep",
      ].includes(setting)
    ) {
      return (
        <div key={setting} className="space-y-1.5">
          <FieldSettingLabel label={toLabel(setting)} helpText={helpText} />
          <Input
            type="number"
            value={
              (selectedField[setting as keyof BuilderField] as
                | number
                | undefined) ?? ""
            }
            onChange={(event) =>
              updateNumberSetting(
                setting as EditableSetting,
                event.target.value,
              )
            }
          />
        </div>
      );
    }

    if (
      setting === "minDate" ||
      setting === "maxDate" ||
      setting === "minTime" ||
      setting === "maxTime"
    ) {
      const type = setting.includes("Time") ? "time" : "date";
      return (
        <div key={setting} className="space-y-1.5">
          <FieldSettingLabel label={toLabel(setting)} helpText={helpText} />
          <Input
            type={type}
            value={
              (selectedField[setting as keyof BuilderField] as
                | string
                | undefined) ?? ""
            }
            onChange={(event) =>
              updateTextSetting(setting as EditableSetting, event.target.value)
            }
          />
        </div>
      );
    }

    if (setting === "dateFormat") {
      return (
        <div key={setting} className="space-y-1.5">
          <FieldSettingLabel label="Date format" helpText={helpText} />
          <Select
            value={selectedField.dateFormat ?? "yyyy-MM-dd"}
            onValueChange={(value) =>
              onUpdateField(selectedField.id, { dateFormat: value })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              {DATE_FORMAT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (setting === "width") {
      return (
        <div key={setting} className="space-y-1.5">
          <FieldSettingLabel label="Width" helpText={helpText} />
          <Select
            value={selectedField.width ?? "full"}
            onValueChange={(value) =>
              onUpdateField(selectedField.id, {
                width: value as BuilderField["width"],
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select width" />
            </SelectTrigger>
            <SelectContent>
              {WIDTH_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (setting === "align") {
      return (
        <div key={setting} className="space-y-1.5">
          <FieldSettingLabel label="Align" helpText={helpText} />
          <Select
            value={selectedField.align ?? "left"}
            onValueChange={(value) =>
              onUpdateField(selectedField.id, {
                align: value as BuilderField["align"],
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select alignment" />
            </SelectTrigger>
            <SelectContent>
              {ALIGN_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (setting === "headingLevel") {
      return (
        <div key={setting} className="space-y-1.5">
          <FieldSettingLabel label="Heading level" helpText={helpText} />
          <Select
            value={String(selectedField.headingLevel ?? 2)}
            onValueChange={(value) =>
              onUpdateField(selectedField.id, { headingLevel: Number(value) })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select heading level" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6].map((level) => (
                <SelectItem key={level} value={String(level)}>
                  H{level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (setting === "ratingIcon") {
      return (
        <div key={setting} className="space-y-1.5">
          <FieldSettingLabel label="Rating icon" helpText={helpText} />
          <Select
            value={selectedField.ratingIcon ?? "star"}
            onValueChange={(value) =>
              onUpdateField(selectedField.id, { ratingIcon: value })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select icon" />
            </SelectTrigger>
            <SelectContent>
              {RATING_ICON_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (setting === "autocomplete") {
      return (
        <div key={setting} className="space-y-1.5">
          <FieldSettingLabel label="Autocomplete" helpText={helpText} />
          <Select
            value={selectedField.autocomplete ?? "off"}
            onValueChange={(value) =>
              onUpdateField(selectedField.id, {
                autocomplete: value as BuilderField["autocomplete"],
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select autocomplete" />
            </SelectTrigger>
            <SelectContent>
              {AUTOCOMPLETE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (setting === "content") {
      return (
        <div key={setting} className="space-y-1.5">
          <FieldSettingLabel label="Content" helpText={helpText} />
          {selectedField.type === "paragraph" ? (
            <Textarea
              rows={6}
              value={selectedField.content ?? ""}
              onChange={(event) =>
                onUpdateField(selectedField.id, { content: event.target.value })
              }
            />
          ) : (
            <Input
              value={selectedField.content ?? ""}
              onChange={(event) =>
                onUpdateField(selectedField.id, { content: event.target.value })
              }
            />
          )}
        </div>
      );
    }

    if (setting === "defaultValue") {
      const options = selectedField.options ?? [];

      if (selectedField.type === "select" || selectedField.type === "radio") {
        return (
          <div key={setting} className="space-y-1.5">
            <FieldSettingLabel label="Default value" helpText={helpText} />
            <Select
              value={
                typeof selectedField.defaultValue === "string"
                  ? selectedField.defaultValue
                  : ""
              }
              onValueChange={(value) =>
                onUpdateField(selectedField.id, { defaultValue: value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select default" />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      }

      return (
        <div key={setting} className="space-y-1.5">
          <FieldSettingLabel label="Default value" helpText={helpText} />
          <Input
            type={
              selectedField.type === "number" ||
              selectedField.type === "range" ||
              selectedField.type === "rating"
                ? "number"
                : selectedField.type === "date"
                  ? "date"
                  : "text"
            }
            value={
              Array.isArray(selectedField.defaultValue)
                ? selectedField.defaultValue.join(", ")
                : typeof selectedField.defaultValue === "boolean"
                  ? String(selectedField.defaultValue)
                  : typeof selectedField.defaultValue === "object"
                    ? `${selectedField.defaultValue.start} - ${selectedField.defaultValue.end}`
                    : (selectedField.defaultValue ?? "")
            }
            onChange={(event) => {
              const value = event.target.value;

              if (
                selectedField.type === "number" ||
                selectedField.type === "range" ||
                selectedField.type === "rating"
              ) {
                onUpdateField(selectedField.id, {
                  defaultValue: toNumber(value),
                });
                return;
              }

              if (
                selectedField.type === "checkbox" ||
                selectedField.type === "toggle"
              ) {
                onUpdateField(selectedField.id, {
                  defaultValue: value === "true",
                });
                return;
              }

              if (selectedField.type === "multiselect") {
                onUpdateField(selectedField.id, {
                  defaultValue: value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                });
                return;
              }

              onUpdateField(selectedField.id, {
                defaultValue: value || undefined,
              });
            }}
          />
        </div>
      );
    }

    if (setting === "disabledDates") {
      const disabledDates = selectedField.disabledDates ?? [];

      return (
        <div key={setting} className="space-y-2">
          <FieldSettingLabel label="Disabled dates" helpText={helpText} />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
              >
                <CalendarPlus className="mr-2 h-4 w-4" />
                Add disabled date
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={undefined}
                onSelect={(date) => {
                  if (!date) return;
                  const nextDate = format(date, "yyyy-MM-dd");
                  if (disabledDates.includes(nextDate)) return;
                  onUpdateField(selectedField.id, {
                    disabledDates: [...disabledDates, nextDate],
                  });
                }}
              />
            </PopoverContent>
          </Popover>
          {disabledDates.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {disabledDates.map((date) => (
                <Badge key={date} variant="secondary" className="gap-1 pr-1">
                  {date}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() =>
                      onUpdateField(selectedField.id, {
                        disabledDates: disabledDates.filter(
                          (item) => item !== date,
                        ),
                      })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      );
    }

    if (setting === "accept") {
      return (
        <div key={setting} className="space-y-3">
          <FieldSettingLabel label="Accepted file types" helpText={helpText} />
          {MIME_GROUPS.map((group) => {
            const groupValues = group.types.map(
              (type) => type.value,
            ) as string[];
            const selectedCount = groupValues.filter((value) =>
              selectedMimeTypes.includes(value),
            ).length;
            const allSelected = selectedCount === groupValues.length;
            const partiallySelected = selectedCount > 0 && !allSelected;

            return (
              <Collapsible
                key={group.label}
                defaultOpen={false}
                className="rounded-md border border-border/70 bg-muted/30"
              >
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex w-full items-center justify-between px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={
                          allSelected
                            ? true
                            : partiallySelected
                              ? "indeterminate"
                              : false
                        }
                        onCheckedChange={(checked) => {
                          const nextKnown = checked
                            ? [...selectedMimeTypes, ...groupValues]
                            : selectedMimeTypes.filter(
                                (value) => !groupValues.includes(value),
                              );
                          updateAcceptValue(nextKnown, customMimeTypes);
                        }}
                        onClick={(event) => event.stopPropagation()}
                      />
                      <span className="text-sm text-foreground">
                        {group.label}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 px-3 pb-3">
                  {group.types.map((type) => (
                    <label
                      key={type.value}
                      className="flex items-center gap-2 text-sm text-foreground"
                    >
                      <Checkbox
                        checked={selectedMimeTypes.includes(type.value)}
                        onCheckedChange={(checked) => {
                          const nextKnown = checked
                            ? [...selectedMimeTypes, type.value]
                            : selectedMimeTypes.filter(
                                (value) => value !== type.value,
                              );
                          updateAcceptValue(nextKnown, customMimeTypes);
                        }}
                      />
                      <span>{type.label}</span>
                    </label>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          })}

          <div className="space-y-2">
            <FieldSettingLabel label="Resulting accept value (read only)" />
            <Input readOnly value={selectedField.accept ?? ""} />
          </div>

          <div className="space-y-2">
            <FieldSettingLabel label="Other MIME type" />
            <div className="flex gap-2">
              <Input
                value={customMimeInput}
                placeholder="application/x-custom"
                onChange={(event) => setCustomMimeInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  const next = customMimeInput.trim();
                  if (!next) return;
                  updateAcceptValue(selectedMimeTypes, [
                    ...customMimeTypes,
                    next,
                  ]);
                  setCustomMimeInput("");
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  const next = customMimeInput.trim();
                  if (!next) return;
                  updateAcceptValue(selectedMimeTypes, [
                    ...customMimeTypes,
                    next,
                  ]);
                  setCustomMimeInput("");
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {customMimeTypes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {customMimeTypes.map((type) => (
                  <Badge key={type} variant="secondary" className="gap-1 pr-1">
                    {type}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() =>
                        updateAcceptValue(
                          selectedMimeTypes,
                          customMimeTypes.filter((value) => value !== type),
                        )
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      );
    }

    if (setting === "checkedValue" || setting === "uncheckedValue") {
      return (
        <div key={setting} className="space-y-1.5">
          <FieldSettingLabel label={toLabel(setting)} helpText={helpText} />
          <Input
            value={
              (selectedField[setting as keyof BuilderField] as
                | string
                | undefined) ?? ""
            }
            onChange={(event) =>
              updateTextSetting(setting as EditableSetting, event.target.value)
            }
          />
        </div>
      );
    }

    if (setting === "conditionalLogic") {
      return (
        <div key={setting} className="space-y-3">
          <FieldSettingLabel label="Conditional logic" helpText={helpText} />
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <FieldSettingLabel label="Action" />
              <Select
                value={conditionalLogic.action}
                onValueChange={(value) =>
                  onUpdateField(selectedField.id, {
                    conditionalLogic: {
                      ...conditionalLogic,
                      action: value as "show" | "hide",
                    },
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="show">Show</SelectItem>
                  <SelectItem value="hide">Hide</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <FieldSettingLabel label="Match" />
              <Select
                value={conditionalLogic.match}
                onValueChange={(value) =>
                  onUpdateField(selectedField.id, {
                    conditionalLogic: {
                      ...conditionalLogic,
                      match: value as "all" | "any",
                    },
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All rules</SelectItem>
                  <SelectItem value="any">Any rule</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            {conditionalFields.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Add another keyed field to this form before creating conditional
                rules.
              </p>
            ) : null}
            {conditionalLogic.rules.map((rule, index) => {
              const targetField =
                conditionalFields.find((field) => field.key === rule.field) ??
                null;
              const availableOperators = getOperatorsForField(targetField);
              const normalizedOperator = normalizeOperator(
                targetField,
                rule.operator,
              );
              const operatorHidesValue =
                !operatorNeedsValue(normalizedOperator);
              const fileSizeUnit =
                typeof rule.value === "number"
                  ? bytesToUnitValue(rule.value)
                  : { size: "", unit: "MB" as const };

              return (
                <div
                  key={`${rule.field}-${index}`}
                  className="relative rounded-md border border-border/70 bg-muted/40 p-2"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2"
                    onClick={() =>
                      onUpdateField(selectedField.id, {
                        conditionalLogic: {
                          ...conditionalLogic,
                          rules: conditionalLogic.rules.filter(
                            (_, ruleIndex) => ruleIndex !== index,
                          ),
                        },
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>

                  <div className="space-y-2 pr-10">
                    <Select
                      value={rule.field}
                      onValueChange={(value) =>
                        onUpdateField(selectedField.id, {
                          conditionalLogic: {
                            ...conditionalLogic,
                            rules: conditionalLogic.rules.map(
                              (item, ruleIndex) =>
                                ruleIndex === index
                                  ? {
                                      ...item,
                                      field: value,
                                      operator: normalizeOperator(
                                        conditionalFields.find(
                                          (field) => field.key === value,
                                        ) ?? null,
                                        undefined,
                                      ),
                                      value: undefined,
                                    }
                                  : item,
                            ),
                          },
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Field" />
                      </SelectTrigger>
                      <SelectContent>
                        {conditionalFields.map((field) => (
                          <SelectItem key={field.key} value={field.key}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div
                      className={cn(
                        "grid gap-2",
                        operatorHidesValue
                          ? "grid-cols-1"
                          : "grid-cols-[2fr_3fr]",
                      )}
                    >
                      <Select
                        value={normalizedOperator}
                        onValueChange={(value) =>
                          onUpdateField(selectedField.id, {
                            conditionalLogic: {
                              ...conditionalLogic,
                              rules: conditionalLogic.rules.map(
                                (item, ruleIndex) =>
                                  ruleIndex === index
                                    ? {
                                        ...item,
                                        operator:
                                          value as ConditionalLogicOperator,
                                        value: operatorNeedsValue(
                                          value as ConditionalLogicOperator,
                                        )
                                          ? undefined
                                          : undefined,
                                      }
                                    : item,
                              ),
                            },
                          })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Operator" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableOperators.map((operatorValue) => {
                            const operatorLabel =
                              RULE_OPERATORS.find(
                                (entry) => entry.value === operatorValue,
                              )?.label ?? operatorValue;
                            return (
                              <SelectItem
                                key={operatorValue}
                                value={operatorValue}
                              >
                                {operatorLabel}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>

                      {!operatorHidesValue
                        ? renderConditionalValueControl({
                            rule,
                            targetField,
                            normalizedOperator,
                            fileSizeUnit,
                            onChange: (value) =>
                              onUpdateField(selectedField.id, {
                                conditionalLogic: {
                                  ...conditionalLogic,
                                  rules: conditionalLogic.rules.map(
                                    (item, ruleIndex) =>
                                      ruleIndex === index
                                        ? { ...item, value }
                                        : item,
                                  ),
                                },
                              }),
                          })
                        : null}
                    </div>
                  </div>
                </div>
              );
            })}

            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={conditionalFields.length === 0}
              onClick={() =>
                onUpdateField(selectedField.id, {
                  conditionalLogic: {
                    ...conditionalLogic,
                    rules: [
                      ...conditionalLogic.rules,
                      {
                        field: conditionalFields[0]?.key ?? "",
                        operator: normalizeOperator(
                          conditionalFields[0] ?? null,
                          undefined,
                        ),
                        value: undefined,
                      },
                    ],
                  },
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Add rule
            </Button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <TooltipProvider>
      <div className="space-y-3">
        <div className="rounded-md border border-border/70 bg-background/50 px-3 py-2">
          <p className="text-xs text-muted-foreground">Type</p>
          <div className="mt-1 flex items-center gap-2 text-sm font-medium text-foreground">
            <definition.icon className="h-4 w-4" />
            {definition.label}
          </div>
        </div>

        {keyChangedWithSubmissions ? (
          <Alert variant="destructive">
            <TriangleAlert className="h-4 w-4" />
            <AlertDescription>
              Changing this key will break the mapping to existing submissions.
            </AlertDescription>
          </Alert>
        ) : null}

        {sectionSettings
          .filter((section) => section.settings.length > 0)
          .map((section, index) => (
            <Section
              key={section.title}
              title={section.title}
              defaultOpen={index < 2 || section.title === "Conditional Logic"}
              open={
                section.title === "Conditional Logic"
                  ? conditionalLogicOpen
                  : undefined
              }
              onOpenChange={
                section.title === "Conditional Logic"
                  ? setConditionalLogicOpen
                  : undefined
              }
            >
              {section.title === "Behavior" &&
              ["select", "multiselect", "radio"].includes(
                selectedField.type,
              ) ? (
                <div className="space-y-2">
                  <FieldSettingLabel
                    label="Options"
                    helpText="Choices shown to the user for this field."
                  />
                  <div className="space-y-2">
                    {(selectedField.options ?? []).map(
                      (option, optionIndex) => (
                        <div
                          key={`option-${optionIndex}`}
                          className="flex items-center gap-2"
                        >
                          <Input
                            value={option}
                            onChange={(event) =>
                              updateOptions(
                                (selectedField.options ?? []).map(
                                  (item, index) =>
                                    index === optionIndex
                                      ? event.target.value
                                      : item,
                                ),
                              )
                            }
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              updateOptions(
                                (selectedField.options ?? []).filter(
                                  (_, index) => index !== optionIndex,
                                ),
                              )
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ),
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={addOption}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add option
                    </Button>
                  </div>
                </div>
              ) : null}

              {section.settings.map(renderSetting)}
            </Section>
          ))}

        <Button
          type="button"
          variant="destructive"
          className="w-full"
          onClick={() => onRemoveField(selectedField.id)}
        >
          Remove Field
        </Button>
      </div>
    </TooltipProvider>
  );
}

function renderConditionalValueControl({
  rule,
  targetField,
  normalizedOperator,
  fileSizeUnit,
  onChange,
}: {
  rule: NonNullable<BuilderField["conditionalLogic"]>["rules"][number];
  targetField: BuilderField | null;
  normalizedOperator: ConditionalLogicOperator;
  fileSizeUnit: { size: string; unit: "KB" | "MB" };
  onChange: (value: string | number | boolean | undefined) => void;
}) {
  if (!targetField) {
    return (
      <Input
        value={rule.value == null ? "" : String(rule.value)}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Value"
      />
    );
  }

  if (
    targetField.type === "select" ||
    targetField.type === "multiselect" ||
    targetField.type === "radio"
  ) {
    return (
      <Select
        value={typeof rule.value === "string" ? rule.value : ""}
        onValueChange={(value) => onChange(value)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select option" />
        </SelectTrigger>
        <SelectContent>
          {(targetField.options ?? []).map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (targetField.type === "checkbox" || targetField.type === "toggle") {
    const checkedValue = targetField.checkedValue ?? "true";
    const uncheckedValue = targetField.uncheckedValue ?? "false";
    return (
      <Select
        value={typeof rule.value === "string" ? rule.value : checkedValue}
        onValueChange={(value) => onChange(value)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select value" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={checkedValue}>{checkedValue}</SelectItem>
          <SelectItem value={uncheckedValue}>{uncheckedValue}</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  if (targetField.type === "number" || targetField.type === "range") {
    return (
      <Input
        type="number"
        min={targetField.min}
        max={targetField.max}
        step={targetField.step}
        value={typeof rule.value === "number" ? rule.value : ""}
        onChange={(event) => onChange(toNumber(event.target.value))}
      />
    );
  }

  if (targetField.type === "rating") {
    const maxRating = targetField.maxRating ?? 5;
    return (
      <Select
        value={typeof rule.value === "number" ? String(rule.value) : ""}
        onValueChange={(value) => onChange(Number(value))}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select rating" />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: maxRating }, (_, index) => index + 1).map(
            (value) => (
              <SelectItem key={value} value={String(value)}>
                {value}
              </SelectItem>
            ),
          )}
        </SelectContent>
      </Select>
    );
  }

  if (targetField.type === "date") {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start"
          >
            <CalendarPlus className="mr-2 h-4 w-4" />
            {typeof rule.value === "string" && rule.value
              ? rule.value
              : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={
              typeof rule.value === "string" && rule.value
                ? new Date(rule.value)
                : undefined
            }
            onSelect={(date) =>
              onChange(date ? format(date, "yyyy-MM-dd") : undefined)
            }
          />
        </PopoverContent>
      </Popover>
    );
  }

  if (targetField.type === "time") {
    return (
      <Input
        type="time"
        value={typeof rule.value === "string" ? rule.value : ""}
        onChange={(event) => onChange(event.target.value || undefined)}
      />
    );
  }

  if (targetField.type === "file") {
    if (
      normalizedOperator === "file_size_less_than" ||
      normalizedOperator === "file_size_greater_than"
    ) {
      return (
        <div className="grid grid-cols-[2fr_1fr] gap-2">
          <Input
            type="number"
            value={fileSizeUnit.size}
            onChange={(event) => {
              const size = toNumber(event.target.value);
              const multiplier =
                FILE_SIZE_UNITS.find((item) => item.value === fileSizeUnit.unit)
                  ?.multiplier ?? 1024 * 1024;
              onChange(size == null ? undefined : size * multiplier);
            }}
          />
          <Select
            value={fileSizeUnit.unit}
            onValueChange={(value) => {
              const size = toNumber(fileSizeUnit.size);
              const multiplier =
                FILE_SIZE_UNITS.find((item) => item.value === value)
                  ?.multiplier ?? 1024 * 1024;
              onChange(size == null ? undefined : size * multiplier);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FILE_SIZE_UNITS.map((unit) => (
                <SelectItem key={unit.value} value={unit.value}>
                  {unit.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    return (
      <Input
        type="number"
        min={1}
        value={typeof rule.value === "number" ? rule.value : ""}
        onChange={(event) => onChange(toNumber(event.target.value))}
      />
    );
  }

  return (
    <Input
      type="text"
      value={rule.value == null ? "" : String(rule.value)}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Value"
    />
  );
}

function operatorNeedsValue(operator: ConditionalLogicOperator) {
  return operator !== "is_empty" && operator !== "is_not_empty";
}

function toLabel(setting: string) {
  return setting
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (value) => value.toUpperCase());
}
