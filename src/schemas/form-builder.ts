import z from "zod";

export const CreateCmsFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Form name must be at least 2 characters." })
    .max(120, { message: "Form name must be at most 120 characters." }),
  description: z.string().trim().max(500, { message: "Description must be at most 500 characters." }).optional(),
});

export const UpdateCmsFormContentSchema = z.object({
  content: z.unknown(),
});

export type CreateCmsFormSchemaType = z.infer<typeof CreateCmsFormSchema>;
export type UpdateCmsFormContentSchemaType = z.infer<typeof UpdateCmsFormContentSchema>;
