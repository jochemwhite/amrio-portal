import z from "zod";

const BuilderFieldTypeSchema = z.enum([
  "text",
  "email",
  "textarea",
  "number",
  "checkbox",
  "select",
  "date",
  "radio",
  "multiselect",
  "toggle",
  "file",
  "phone",
  "password",
  "url",
  "time",
  "dateRange",
  "range",
  "rating",
  "heading",
  "paragraph",
  "divider",
  "section",
]);

const ConditionalLogicOperatorSchema = z.enum([
  "equals",
  "not_equals",
  "contains",
  "not_contains",
  "starts_with",
  "ends_with",
  "is_empty",
  "is_not_empty",
  "greater_than",
  "less_than",
  "greater_than_or_equal",
  "less_than_or_equal",
  "file_count_equals",
  "file_count_greater_than",
  "file_count_less_than",
  "file_size_less_than",
  "file_size_greater_than",
]);

const ConditionalLogicSchema = z.object({
  action: z.enum(["show", "hide"]),
  match: z.enum(["all", "any"]),
  rules: z.array(
    z.object({
      field: z.string().min(1),
      operator: ConditionalLogicOperatorSchema,
      value: z.union([z.string(), z.number(), z.boolean()]).optional(),
    }),
  ),
});

const BuilderFieldSchema = z.object({
  id: z.string().min(1),
  type: BuilderFieldTypeSchema,
  key: z.string().min(1).optional(),
  label: z.string().min(1).optional(),
  required: z.boolean().optional(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  options: z.array(z.string()).optional(),
  defaultValue: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
    z.object({
      start: z.string(),
      end: z.string(),
    }),
  ]).optional(),
  readOnly: z.boolean().optional(),
  hidden: z.boolean().optional(),
  width: z.enum(["full", "half", "third"]).optional(),
  conditionalLogic: ConditionalLogicSchema.optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  rows: z.number().optional(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  autocomplete: z.enum(["off", "name", "email", "username", "new-password", "current-password", "tel", "url"]).optional(),
  searchable: z.boolean().optional(),
  minSelections: z.number().optional(),
  maxSelections: z.number().optional(),
  minDate: z.string().optional(),
  maxDate: z.string().optional(),
  disabledDates: z.array(z.string()).optional(),
  dateFormat: z.string().optional(),
  minTime: z.string().optional(),
  maxTime: z.string().optional(),
  timeStep: z.number().optional(),
  minRange: z.number().optional(),
  maxRange: z.number().optional(),
  checkedValue: z.string().optional(),
  uncheckedValue: z.string().optional(),
  accept: z.string().optional(),
  multiple: z.boolean().optional(),
  maxFileSize: z.number().optional(),
  maxFiles: z.number().optional(),
  maxRating: z.number().optional(),
  ratingStep: z.number().optional(),
  ratingIcon: z.string().optional(),
  content: z.string().optional(),
  headingLevel: z.number().optional(),
  align: z.enum(["left", "center", "right"]).optional(),
  markdown: z.boolean().optional(),
  collapsible: z.boolean().optional(),
  collapsed: z.boolean().optional(),
}).superRefine((field, ctx) => {
  const layoutField = ["heading", "paragraph", "divider", "section"].includes(field.type);

  if (layoutField && field.key) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Layout fields must not define a key.",
      path: ["key"],
    });
  }

  if (!layoutField) {
    if (!field.key) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Submission fields must define a key.",
        path: ["key"],
      });
    }

    if (field.key && !/^[a-z0-9_]+$/.test(field.key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Field keys must be lowercase alphanumeric with underscores only.",
        path: ["key"],
      });
    }
  }

  if (field.type === "heading" && !field.content) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Heading fields must define content.",
      path: ["content"],
    });
  }
});

export const CreateCmsFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Form name must be at least 2 characters." })
    .max(120, { message: "Form name must be at most 120 characters." }),
  description: z.string().trim().max(500, { message: "Description must be at most 500 characters." }).optional(),
});

export const UpdateCmsFormContentSchema = z.object({
  content: z.array(BuilderFieldSchema).superRefine((fields, ctx) => {
    const seenKeys = new Map<string, number>();

    fields.forEach((field, index) => {
      if (!field.key) return;
      const firstIndex = seenKeys.get(field.key);
      if (firstIndex != null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Field keys must be unique within a form.",
          path: [index, "key"],
        });
      } else {
        seenKeys.set(field.key, index);
      }
    });
  }),
});

export type CreateCmsFormSchemaType = z.infer<typeof CreateCmsFormSchema>;
export type UpdateCmsFormContentSchemaType = z.infer<typeof UpdateCmsFormContentSchema>;
