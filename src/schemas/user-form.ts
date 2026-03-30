import z from "zod";

export const TENANT_ROLE_OPTIONS = ["admin", "editor", "viewer"] as const;
export const BUSINESS_TYPE_OPTIONS = ["BV", "NV", "Eenmanszaak", "VOF", "Other"] as const;
export const DEFAULT_COUNTRY = "Netherlands";

export const UserFormSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.email(),
  global_role: z.string().optional().nullable(),
  send_invite: z.boolean().optional(),
  tenant_id: z.string().uuid().optional(),
  tenant_role: z.enum(TENANT_ROLE_OPTIONS).optional(),
  new_tenant: z.object({
    name: z.string().trim().min(1, "Company name is required."),
    business_type: z.enum(BUSINESS_TYPE_OPTIONS),
    contact_email: z.email(),
    country: z.string().trim().min(1, "Country is required."),
  }).optional(),
  no_tenant: z.boolean().optional(),
}).superRefine((values, ctx) => {
  const optionCount = Number(Boolean(values.tenant_id)) + Number(Boolean(values.new_tenant)) + Number(Boolean(values.no_tenant));

  if (optionCount !== 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Choose exactly one tenant assignment option.",
      path: ["tenant_id"],
    });
  }

  if (values.tenant_id && !values.tenant_role) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Tenant role is required when assigning an existing tenant.",
      path: ["tenant_role"],
    });
  }
});

export type UserFormValues = z.infer<typeof UserFormSchema>;
