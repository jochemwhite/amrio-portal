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

const BuilderFieldSchema = z.object({
  id: z.string().min(1),
  type: BuilderFieldTypeSchema,
  key: z.string().min(1),
  label: z.string().min(1),
  required: z.boolean(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  options: z.array(z.string()).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  minDate: z.string().optional(),
  maxDate: z.string().optional(),
  checkedValue: z.string().optional(),
  uncheckedValue: z.string().optional(),
  accept: z.string().optional(),
  multiple: z.boolean().optional(),
  maxRating: z.number().optional(),
  content: z.string().optional(),
  headingLevel: z.number().optional(),
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
  content: z.array(BuilderFieldSchema),
});

export type CreateCmsFormSchemaType = z.infer<typeof CreateCmsFormSchema>;
export type UpdateCmsFormContentSchemaType = z.infer<typeof UpdateCmsFormContentSchema>;
