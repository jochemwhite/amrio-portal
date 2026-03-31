import z from "zod";

import { BUSINESS_TYPE_OPTIONS, DEFAULT_COUNTRY } from "@/schemas/user-form";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const onboardingProfileSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required."),
  last_name: z.string().trim().min(1, "Last name is required."),
  avatar: z
    .custom<File | null | undefined>((value) => {
      if (value == null) {
        return true;
      }

      return typeof File !== "undefined" && value instanceof File;
    }, "Invalid avatar file.")
    .superRefine((file, ctx) => {
      if (!(typeof File !== "undefined" && file instanceof File)) {
        return;
      }

      if (!ALLOWED_AVATAR_TYPES.includes(file.type as (typeof ALLOWED_AVATAR_TYPES)[number])) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Avatar must be a JPEG, PNG, or WebP image.",
        });
      }

      if (file.size > MAX_AVATAR_BYTES) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Avatar must be 2MB or smaller.",
        });
      }
    })
    .optional(),
});

export const onboardingPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirm_password: z.string().min(8, "Confirm your password."),
}).refine((values) => values.password === values.confirm_password, {
  message: "Passwords do not match.",
  path: ["confirm_password"],
});

export const onboardingTenantSchema = z.object({
  name: z.string().trim().min(1, "Company name is required."),
  business_type: z.enum(BUSINESS_TYPE_OPTIONS),
  kvk_number: z.string().regex(/^\d{8}$/, "KVK number must be exactly 8 digits").optional(),
  vat_number: z.string().regex(/^NL\d{9}B\d{2}$/, "Invalid Dutch VAT number (e.g. NL123456789B01)").optional().or(z.literal("")),
  contact_email: z.email(),
  phone_country_code: z.string().trim().min(1),
  phone: z.string().regex(/^\+?[\d\s\-]{7,15}$/, "Invalid phone number").optional().or(z.literal("")),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  address: z.string().trim().min(1, "Street address is required."),
  address2: z.string().trim().optional().or(z.literal("")),
  postal_code: z.string().regex(/^\d{4}\s?[A-Z]{2}$/, "Invalid Dutch postal code (e.g. 1234 AB)"),
  city: z.string().trim().min(1, "City is required."),
  state_or_province: z.string().trim().optional().or(z.literal("")),
  country: z.string().trim().min(1).default(DEFAULT_COUNTRY),
});

export type OnboardingProfileValues = z.infer<typeof onboardingProfileSchema>;
export type OnboardingPasswordValues = z.infer<typeof onboardingPasswordSchema>;
export type OnboardingTenantValues = z.infer<typeof onboardingTenantSchema>;

export const PHONE_COUNTRY_OPTIONS = [
  { value: "+31", label: "Netherlands (+31)" },
  { value: "+32", label: "Belgium (+32)" },
  { value: "+44", label: "United Kingdom (+44)" },
  { value: "+49", label: "Germany (+49)" },
  { value: "+1", label: "United States (+1)" },
] as const;
