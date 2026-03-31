"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

import { updateTenantDetails } from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  onboardingTenantSchema,
  PHONE_COUNTRY_OPTIONS,
} from "@/schemas/onboarding";
import { BUSINESS_TYPE_OPTIONS, DEFAULT_COUNTRY } from "@/schemas/user-form";

type OnboardingTenantFormValues = z.input<typeof onboardingTenantSchema>;

interface StepTenantSetupProps {
  userId: string;
  tenantId: string;
  tenant: {
    name: string;
    business_type: string;
    kvk_number: string | null;
    vat_number: string | null;
    contact_email: string | null;
    phone: string | null;
    website: string | null;
    address: string | null;
    address2: string | null;
    postal_code: string | null;
    city: string | null;
    state_or_province: string | null;
    country: string | null;
  };
  nextStep: number;
}

function splitPhoneNumber(phone: string | null) {
  if (!phone) {
    return { phone_country_code: "+31", phone: "" };
  }

  const match = phone.match(/^(\+\d+)\s*(.*)$/);
  if (!match) {
    return { phone_country_code: "+31", phone };
  }

  return {
    phone_country_code: match[1],
    phone: match[2] ?? "",
  };
}

export function StepTenantSetup({
  userId,
  tenantId,
  tenant,
  nextStep,
}: StepTenantSetupProps) {
  const router = useRouter();
  const phoneDefaults = useMemo(() => splitPhoneNumber(tenant.phone), [tenant.phone]);

  const form = useForm<OnboardingTenantFormValues>({
    resolver: zodResolver(onboardingTenantSchema),
    defaultValues: {
      name: tenant.name ?? "",
      business_type: BUSINESS_TYPE_OPTIONS.includes(tenant.business_type as (typeof BUSINESS_TYPE_OPTIONS)[number])
        ? (tenant.business_type as (typeof BUSINESS_TYPE_OPTIONS)[number])
        : BUSINESS_TYPE_OPTIONS[0],
      kvk_number: tenant.kvk_number ?? "",
      vat_number: tenant.vat_number ?? "",
      contact_email: tenant.contact_email ?? "",
      phone_country_code: phoneDefaults.phone_country_code,
      phone: phoneDefaults.phone,
      website: tenant.website ?? "",
      address: tenant.address ?? "",
      address2: tenant.address2 ?? "",
      postal_code: tenant.postal_code ?? "",
      city: tenant.city ?? "",
      state_or_province: tenant.state_or_province ?? "",
      country: tenant.country ?? DEFAULT_COUNTRY,
    },
  });

  const onSubmit = async (values: OnboardingTenantFormValues) => {
    const phoneValue = values.phone ?? "";
    const phone = phoneValue.trim()
      ? `${values.phone_country_code} ${phoneValue.trim()}`
      : "";

    const result = await updateTenantDetails(tenantId, userId, {
      ...values,
      country: values.country ?? DEFAULT_COUNTRY,
      phone,
    });

    if (!result.success) {
      toast.error(result.error ?? "Failed to update tenant");
      return;
    }

    toast.success("Company profile updated");
    router.push(`/onboarding?step=${nextStep}`);
    router.refresh();
  };

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Company name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="business_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a business type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BUSINESS_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="kvk_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>KVK number</FormLabel>
                <FormControl>
                  <Input inputMode="numeric" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="vat_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>VAT / BTW number</FormLabel>
                <FormControl>
                  <Input placeholder="NL123456789B01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contact_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid gap-4 sm:grid-cols-[180px_1fr] sm:col-span-2">
            <FormField
              control={form.control}
              name="phone_country_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country code</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Code" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PHONE_COUNTRY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="612345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Street address</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address2"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Address line 2</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="postal_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Postal code</FormLabel>
                <FormControl>
                  <Input placeholder="1234 AB" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="state_or_province"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Province</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Netherlands">Netherlands</SelectItem>
                    <SelectItem value="Belgium">Belgium</SelectItem>
                    <SelectItem value="Germany">Germany</SelectItem>
                    <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                    <SelectItem value="United States">United States</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : null}
            Save and continue
          </Button>
        </div>
      </form>
    </Form>
  );
}
