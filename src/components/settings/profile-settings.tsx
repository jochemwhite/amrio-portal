"use client";
import React, { useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { Database } from "@/types/supabase";
import { updateUser } from "@/actions/authentication/user-settings";

interface ProfileSectionProps {
  user: Database["public"]["Tables"]["users"]["Row"];
  staggerIndex?: number;
}

export const profileFormSchema = z.object({
  first_name: z
    .string()
    .min(2, { message: "First name must be at least 2 characters" })
    .max(50, { message: "First name must be less than 50 characters" }),
  last_name: z
    .string()
    .min(2, { message: "Last name must be at least 2 characters" })
    .max(50, { message: "Last name must be less than 50 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }).optional(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const ProfileSection: React.FC<ProfileSectionProps> = ({ user, staggerIndex: _staggerIndex = 0 }) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email,
    },
  });

  useEffect(() => {
    form.setValue("first_name", user.first_name || "");
    form.setValue("last_name", user.last_name || "");
    form.setValue("email", user.email);
  }, [form, user]);

  const handleSave = async (values: z.infer<typeof profileFormSchema>) => {
    setIsLoading(true);

    toast.promise(
      async () =>
        updateUser(values).then((res) => {
          if (!res.success) throw new Error(res.error);
          return res;
        }),
      {
        loading: "Saving...",
        success: () => "Profile updated successfully",
        error: (err) => {
          handleReset();
          return err.message || "Failed to save profile";
        },
        finally() {
          setIsLoading(false);
        },
      }
    );
  };

  const handleReset = () => {
    form.reset({
      last_name: user.last_name || "",
      first_name: user.first_name || "",
      email: user.email,
    });
  };

  return (
    <Card
      data-stagger-index={_staggerIndex}
      className="overflow-hidden border-border/60 bg-card/80 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/70"
    >
      <CardHeader className="space-y-1.5 pb-4">
        <CardTitle className="text-xl font-semibold tracking-tight">Personal Information</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">Update your personal details</CardDescription>
      </CardHeader>

      <form onSubmit={form.handleSubmit(handleSave)}>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field data-invalid={!!form.formState.errors.first_name}>
              <FieldLabel htmlFor="first_name">First Name</FieldLabel>
              <Input id="first_name" {...form.register("first_name")} disabled={isLoading} />
              <FieldError errors={[form.formState.errors.first_name]} />
            </Field>

            <Field data-invalid={!!form.formState.errors.last_name}>
              <FieldLabel htmlFor="last_name">Last Name</FieldLabel>
              <Input id="last_name" {...form.register("last_name")} disabled={isLoading} />
              <FieldError errors={[form.formState.errors.last_name]} />
            </Field>
          </div>

          <Field className="mb-4">
            <FieldLabel htmlFor="email">Email Address</FieldLabel>
            <Input id="email" {...form.register("email")} disabled className="" />
            <p className="rounded-md border px-3 py-2 text-xs text-muted-foreground">
              Email address cannot be changed
            </p>
          </Field>
        </CardContent>

        <CardFooter className="flex justify-end bg-transparent ">
          <Button type="submit" disabled={isLoading}>
            Save Changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
