"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { updateUserPassword } from "@/actions/authentication/user-settings";

interface PasswordSectionProps {
  staggerIndex?: number;
}

export const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, { message: "Current password is required" }),
    newPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, {
        message: "Password must include uppercase, lowercase, and numbers",
      }),
    confirmPassword: z.string().min(1, { message: "Please confirm your password" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export const PasswordSection: React.FC<PasswordSectionProps> = ({ staggerIndex: _staggerIndex = 0 }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const handleSubmit = async (values: PasswordFormValues) => {
    setIsLoading(true);

    toast.promise(
      async () => {
        const { success, error } = await updateUserPassword(values.currentPassword, values.newPassword);
        if (!success) {
          throw error || "Failed to update password";
        }
        return true;
      },
      { 
        loading: "Updating password...",
        success: "Password updated successfully",
        error: (error) => {
          return error;
        },
        finally() {
          setIsLoading(false);
          form.reset();
        }
      }
    );  
  };

  return (
    <Card
      data-stagger-index={_staggerIndex}
      className="overflow-hidden border-border/60 bg-card/80 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/70"
    >
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <CardHeader className="space-y-1.5 pb-4">
          <CardTitle className="text-xl font-semibold tracking-tight">Password Security</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">Change your account password</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Field data-invalid={!!form.formState.errors.currentPassword}>
            <FieldLabel htmlFor="currentPassword">Current Password</FieldLabel>
            <div className="relative">
              <Input
                id="currentPassword"
                {...form.register("currentPassword")}
                disabled={isLoading}
                type={showCurrentPassword ? "text" : "password"}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-8 px-2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? "Hide" : "Show"}
              </Button>
            </div>
            <FieldError errors={[form.formState.errors.currentPassword]} />
          </Field>

          <Field data-invalid={!!form.formState.errors.newPassword}>
            <FieldLabel htmlFor="newPassword">New Password</FieldLabel>
            <div className="relative">
              <Input
                id="newPassword"
                {...form.register("newPassword")}
                disabled={isLoading}
                type={showNewPassword ? "text" : "password"}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-8 px-2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? "Hide" : "Show"}
              </Button>
            </div>
            <FieldError errors={[form.formState.errors.newPassword]} />
          </Field>

          <Field data-invalid={!!form.formState.errors.confirmPassword}>
            <FieldLabel htmlFor="confirmPassword">Confirm New Password</FieldLabel>
            <div className="relative">
              <Input
                id="confirmPassword"
                {...form.register("confirmPassword")}
                disabled={isLoading}
                type={showConfirmPassword ? "text" : "password"}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-8 px-2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </Button>
            </div>
            <FieldError errors={[form.formState.errors.confirmPassword]} />
          </Field>

          <div className="flex items-start space-x-2 rounded-md border border-border/60 bg-muted/20 p-3 text-sm text-muted-foreground mb-4">
            <ShieldCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>Strong passwords include a mix of uppercase letters, lowercase letters, numbers, and special characters.</div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end border-t border-border/60 bg-muted/10 px-6 py-4">
          <Button type="submit" disabled={isLoading}>
            Update Password
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
