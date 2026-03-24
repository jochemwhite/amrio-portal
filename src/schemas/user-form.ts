import z from "zod";

export const UserFormSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.email(),
  global_role: z.string().optional().nullable(),
  send_invite: z.boolean().optional(),
});

export type UserFormValues = z.infer<typeof UserFormSchema>;
